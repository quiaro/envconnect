import { getUniqueId } from '../utils'
import {
  MAP_METRICS_TO_QUESTION_FORMS,
  METRIC_ASSESSMENT,
  METRIC_COMMENT,
  METRIC_EMISSIONS,
  METRIC_ENERGY_CONSUMED,
  METRIC_FRAMEWORK,
  METRIC_RELEVANCE,
  METRIC_WASTE_GENERATED,
  METRIC_WATER_CONSUMED,
  METRIC_YES_NO,
  METRICS_WITH_UNIT,
} from '../../config/questionFormTypes'

export default class Answer {
  constructor({
    id = getUniqueId(),
    question,
    author,
    metric,
    created = new Date().toISOString(),
    answers = [],
    answered = false,
  }) {
    this.id = id
    this.question = question // question ID
    this.metric = metric
    this.author = author
    this.created = created
    this.answers = answers
    this.answered = answered
  }

  static createFromPrevious(answer, attrs) {
    const { id, answers, ...rest } = answer
    const newAnswer = new Answer({
      ...rest,
      ...attrs,
    })

    // Remove any comments that may exist
    const filtered = answers.filter(
      (answer) => answer.metric !== METRIC_COMMENT
    )
    newAnswer.update(filtered)
    return newAnswer
  }

  clone() {
    const { id, ...rest } = this
    return new Answer(rest)
  }
  isAnswered() {
    const answer = this.answers.find((answer) => answer.default)
    if (METRICS_WITH_UNIT.includes(answer.metric)) {
      return !!answer.measured && !!answer.unit
    } else if (answer.metric === METRIC_EMISSIONS) {
      const relevance = this.answers.find(
        (answer) => answer.metric === METRIC_RELEVANCE
      )
      return !!answer.measured && !!relevance.measured
    } else {
      return !!answer.measured
    }
  }
  load(answerObjects) {
    let answer
    let metric
    let values = []

    for (let i = 0; i < answerObjects.length; i++) {
      const item = answerObjects[i]
      metric = item.default_metric
      if (item.metric === item.default_metric || item.metric === null) {
        answer = item
      } else {
        values.push({
          metric: item.metric,
          measured: item.measured,
        })
      }
    }

    if (answer) {
      if (METRICS_WITH_UNIT.includes(metric)) {
        values.unshift({
          default: true,
          metric,
          measured: answer.measured,
          unit: answer.unit,
        })
      } else {
        values.unshift({
          default: true,
          metric,
          measured: answer.measured,
        })
      }
    }

    this.author = answer && answer.collected_by
    this.created = answer && answer.created_at
    this.metric = metric
    this.answers = values
    this.answered = this.isAnswered()
  }
  reset() {
    this.answers = this.answers.map((answer) => {
      return answer.unit
        ? { ...answer, measured: '', unit: '' }
        : { ...answer, measured: '' }
    })
    this.answered = this.isAnswered()
    return this
  }
  render() {
    const questionForm = MAP_METRICS_TO_QUESTION_FORMS[this.metric]
    if (!questionForm) return ''

    let output = ''
    if (
      this.metric === METRIC_ASSESSMENT ||
      this.metric === METRIC_FRAMEWORK ||
      this.metric === METRIC_YES_NO
    ) {
      const options = questionForm.options
      const selected = options.find(
        (opt) => opt.value === this.answers[0].measured
      )
      output = selected ? selected.text : ''
    } else if (this.metric === METRIC_EMISSIONS) {
      const answer = this.answers[0]
      const relevance = this.answers.find(
        (answer) => answer.metric === METRIC_RELEVANCE
      )
      if (!answer.measured) {
        output = ''
      } else if (relevance && relevance.measured) {
        const selected = questionForm.options.find(
          (opt) => opt.value === relevance.measured
        )
        output = `${answer.measured} <small>${questionForm.unit.text} | ${selected.text}</small>`
      } else {
        output = `${answer.measured} <small>${questionForm.unit.text}</small>`
      }
    } else if (
      this.metric === METRIC_ENERGY_CONSUMED ||
      this.metric === METRIC_WATER_CONSUMED ||
      this.metric === METRIC_WASTE_GENERATED
    ) {
      const answer = this.answers[0]
      const selected = questionForm.options.find(
        (opt) => opt.value === answer.unit
      )
      output = selected ? `${answer.measured} ${selected.text}` : ''
    } else {
      // METRIC_EMPLOYEE_COUNT
      // METRIC_REVENUE_GENERATED
      // METRIC_FREETEXT
      output = this.answers[0].measured
    }
    return output
  }
  update(values) {
    this.answers = values
    this.answered = this.isAnswered()
  }
  toPayload() {
    return this.answers
      .filter((answer) => answer.metric && answer.measured)
      .map((answer) => {
        const payload = {
          metric: answer.metric,
          created_at: answer.created,
          collected_by: answer.author,
        }
        switch (answer.metric) {
          case METRIC_ENERGY_CONSUMED:
          case METRIC_WATER_CONSUMED:
          case METRIC_WASTE_GENERATED:
            payload.measured = answer.measured
            payload.unit = answer.unit
            break
          default:
            payload.measured = answer.measured
            break
        }
        return payload
      })
  }
}
