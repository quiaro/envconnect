import { makeServer } from '../../src/mocks/server'
import {
  createOrgAssessmentEmpty,
  createOrgAssessmentPracticesIncomplete,
  createOrgAssessmentPreviousAnswers,
} from '../../src/mocks/scenarios'
import { STEP_PRACTICE_KEY } from '../../src/config/app'

const ORG_SLUG = 'test_org'
const ORG_NAME = 'Test Organization'
const ASSESSMENT_HOME_URL = `/${ORG_SLUG}/assess/1/`
const ASSESSMENT_PRACTICES_URL = `${ASSESSMENT_HOME_URL}content/metal/boxes-and-enclosures/`

describe('Supplier App: Assessment Practices', () => {
  let server

  beforeEach(() => {
    // Clean before next test runs per:
    // https://docs.cypress.io/guides/references/best-practices.html#Using-after-or-afterEach-hooks
    if (server) server.shutdown()
    server = makeServer({
      environment: 'test',
      apiBasePath: `${Cypress.env('ROOT')}${Cypress.env('API_BASE')}`,
    })
  })

  it('displays the main content correctly for a new assessment', () => {
    server.loadFixtures('industries', 'questions')
    createOrgAssessmentEmpty(server, ORG_SLUG, ORG_NAME)

    cy.visit(ASSESSMENT_HOME_URL)
    cy.get('[data-cy=industry-form]').as('industryForm')
    cy.get('[data-cy=industry-label]').click()
    cy.get('.v-menu__content')
      .find('.v-list-item')
      .contains('Boxes & enclosures')
      .click()
    cy.get('@industryForm').find('button[type=submit]').click()
    cy.get(`[data-cy=${STEP_PRACTICE_KEY}]`).click()

    // Displays an intro view before the main content
    cy.url().should('include', `${ASSESSMENT_HOME_URL}intro/`)
    cy.get(`[data-cy=btn-continue]`).click()
    cy.url().should('include', `${ASSESSMENT_HOME_URL}content/`)
    cy.get('[data-cy=assessment-section]').its('length').should('eq', 3)
    cy.contains('0 / 10 questions')
  })

  it('displays the main content correctly for an existing assessment', () => {
    server.loadFixtures('industries', 'questions')
    createOrgAssessmentPracticesIncomplete(server, ORG_SLUG, ORG_NAME)

    cy.visit(ASSESSMENT_HOME_URL)
    cy.get(`[data-cy=${STEP_PRACTICE_KEY}]`).click()

    // Displays an intro view before the main content
    cy.url().should('include', `${ASSESSMENT_HOME_URL}intro/`)
    cy.get(`[data-cy=btn-continue]`).click()
    cy.url().should('include', `${ASSESSMENT_HOME_URL}content/`)
    cy.get('[data-cy=assessment-section]').its('length').should('eq', 3)
    cy.get('[data-cy=assessment-section]').first().as('firstSection')
    cy.get('@firstSection')
      .find('[data-cy=practice-group-header]')
      .contains('Governance & management')
    cy.get('@firstSection').find('h4').contains('Assessment')
    cy.get('@firstSection').find('.progress-label').contains('1 / 1 questions')
    cy.contains('1 / 10 questions')
  })

  it('displays a dialog if a previous assessment in the same industry has been submitted', () => {
    server.loadFixtures('industries', 'questions')
    createOrgAssessmentPreviousAnswers(server, ORG_SLUG, ORG_NAME)

    cy.visit(ASSESSMENT_PRACTICES_URL)
    cy.get('.v-dialog--persistent').within(($dialog) => {
      cy.wrap($dialog).should('be.visible')
      cy.get('.headline').contains('Previous Answers')
      cy.get('button').click()
      cy.wrap($dialog).should('not.be.visible')
    })
  })

  it('displays answers from a previous assessment in the same industry', () => {
    server.loadFixtures('industries', 'questions')
    createOrgAssessmentPreviousAnswers(server, ORG_SLUG, ORG_NAME)

    cy.visit(
      `${ASSESSMENT_PRACTICES_URL}?section=governance-management&subcategory=governance-management-assessment`
    )
    cy.get('[data-cy=previous-answers-column]').contains('Previous Answers')
    cy.get('[data-cy=previous-answer]').each(($prevAnswer) => {
      cy.wrap($prevAnswer).should('not.be.empty')
    })

    cy.visit(
      `${ASSESSMENT_PRACTICES_URL}?section=governance-management&subcategory=governance-management-general`
    )
    cy.get('[data-cy=previous-answers-column]').contains('Previous Answers')
    cy.get('[data-cy=previous-answer]').each(($prevAnswer) => {
      cy.wrap($prevAnswer).should('not.be.empty')
    })

    cy.visit(`${ASSESSMENT_PRACTICES_URL}?section=design&subcategory=design`)
    cy.get('[data-cy=previous-answers-column]').contains('Previous Answers')
    cy.get('[data-cy=previous-answer]').each(($prevAnswer) => {
      cy.wrap($prevAnswer).should('not.be.empty')
    })

    cy.visit(
      `${ASSESSMENT_PRACTICES_URL}?section=production&subcategory=production-combustion`
    )
    cy.get('[data-cy=previous-answers-column]').contains('Previous Answers')
    cy.get('[data-cy=previous-answer]').each(($prevAnswer) => {
      cy.wrap($prevAnswer).should('not.be.empty')
    })

    cy.visit(
      `${ASSESSMENT_PRACTICES_URL}?section=production&subcategory=production-hot-water-system`
    )
    cy.get('[data-cy=previous-answers-column]').contains('Previous Answers')
    cy.get('[data-cy=previous-answer]').each(($prevAnswer) => {
      cy.wrap($prevAnswer).should('not.be.empty')
    })
  })

  it('lets users complete assessment by filling in and navigating between answers', () => {
    server.loadFixtures('industries', 'questions')
    createOrgAssessmentPracticesIncomplete(server, ORG_SLUG, ORG_NAME)

    cy.visit(ASSESSMENT_PRACTICES_URL)
    cy.contains('1 / 10 questions')
    cy.get('[data-cy=btn-complete]').should('not.be.visible')

    cy.get('[data-cy=assessment-section] .v-list-item').first().click()

    // Select answer
    cy.get('[data-cy=answer-link]').first().click()

    // Edit answer
    cy.get('[data-cy=question-footer-textarea]').type('textarea content')
    cy.get('button[type=submit]').click()
    cy.contains('1 / 10 questions') // Doesn't change progress indicator

    // New answer
    cy.get('[data-cy=quantity]').find('input').type('1234')
    cy.get('[data-cy=unit]').find('[role=button]').click()
    cy.get('.v-menu__content .v-list-item').first().click()
    cy.get('[data-cy=question-footer-textarea]').type('textarea content')
    cy.get('button[type=submit]').click()
    cy.contains('2 / 10 questions')

    cy.get('[data-cy=number]').find('input').type('1234')
    cy.get('[data-cy=question-footer-textarea]').type('textarea content')
    cy.get('button[type=submit]').click()
    cy.contains('3 / 10 questions')

    cy.get('[data-cy=number]').find('input').type('1234')
    cy.get('[data-cy=question-footer-textarea]').type('textarea content')
    cy.get('button[type=submit]').click()
    cy.contains('4 / 10 questions')

    cy.get('[data-cy=quantity]').find('input').type('1234')
    cy.get('[data-cy=unit]').find('[role=button]').click()
    cy.get('.v-menu__content .v-list-item').first().click()
    cy.get('[data-cy=question-footer-textarea]').type('textarea content')
    cy.get('button[type=submit]').click()
    cy.contains('5 / 10 questions')

    cy.get('[data-cy=quantity]').find('input').type('1234')
    cy.get('[data-cy=unit]').find('[role=button]').click()
    cy.get('.v-menu__content .v-list-item').first().click()
    cy.get('[data-cy=question-footer-textarea]').type('textarea content')
    cy.get('button[type=submit]').click()
    cy.contains('6 / 10 questions')

    cy.get('.v-label').first().click()
    cy.get('[data-cy=question-footer-textarea]').type('textarea content')
    cy.get('button[type=submit]').click()
    cy.contains('7 / 10 questions')

    cy.get('.v-label').first().click()
    cy.get('[data-cy=question-footer-textarea]').type('textarea content')
    cy.get('button[type=submit]').click()
    cy.contains('8 / 10 questions')

    cy.get('.v-label').first().click()
    cy.get('[data-cy=question-footer-textarea]').type('textarea content')
    cy.get('button[type=submit]').click()
    cy.contains('9 / 10 questions')

    cy.get('.v-label').first().click()
    cy.get('[data-cy=question-footer-textarea]').type('textarea content')
    cy.get('button[type=submit]').click()
    cy.get('[data-cy=btn-complete]').should('be.visible').click()
    cy.url().should('match', /\/assess\/1\/$/)
  })
})