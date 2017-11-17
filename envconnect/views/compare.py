# Copyright (c) 2017, DjaoDjin inc.
# see LICENSE.

import logging

from django.core.urlresolvers import reverse
from django.shortcuts import get_object_or_404
from django.views.generic import TemplateView
from deployutils.apps.django.templatetags.deployutils_prefixtags import (
    site_prefixed)
from survey.models import Matrix

from ..mixins import AccountMixin, PermissionMixin

LOGGER = logging.getLogger(__name__)


class ReportingEntitiesView(AccountMixin, PermissionMixin, TemplateView):

    template_name = 'envconnect/reporting/index.html'

    def get_context_data(self, **kwargs):
        context = super(ReportingEntitiesView, self).get_context_data(**kwargs)
        accounts = self.managed_accounts
        if len(accounts) == 1:
            totals = get_object_or_404(
                Matrix, account__slug=accounts[0], metric__slug='totals')
            totals_chart_url = reverse('matrix_chart',
                args=(accounts[0], '/%s' % totals.slug))
        else:
            totals_chart_url = reverse('envconnect_portfolio',
                args=('/totals',))
        urls = {
            'api_suppliers': reverse('api_suppliers', args=(self.account,)),
            'api_accessibles': site_prefixed(
                "/api/profile/%(account)s/plans/%(account)s-reporting/"\
                "subscriptions/" % {'account': self.account}),
            'api_organizations': site_prefixed("/api/profile/"),
            'totals_chart': totals_chart_url,
        }
        context.update({'score_toggle': True})
        self.update_context_urls(context, urls)
        return context
