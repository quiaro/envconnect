# Copyright (c) 2017, DjaoDjin inc.
# see LICENSE.

from rest_framework import serializers
from rest_framework.generics import (get_object_or_404, ListAPIView,
     GenericAPIView)
from rest_framework.mixins import (CreateModelMixin, RetrieveModelMixin,
    DestroyModelMixin)
from rest_framework.response import Response
from rest_framework.relations import PrimaryKeyRelatedField

from ..mixins import ImprovementQuerySetMixin
from ..models import Improvement, Consumption


class ImprovementSerializer(serializers.ModelSerializer):

    consumption = PrimaryKeyRelatedField(queryset=Consumption.objects.all())

    class Meta(object):
        model = Improvement
        fields = ('consumption',)


class ImprovementListAPIView(ImprovementQuerySetMixin, ListAPIView):

    serializer_class = ImprovementSerializer

    def get_serializer_context(self):
        """
        Provides a list of opportunities, one for each ``Question``.
        """
        context = super(ImprovementListAPIView, self).get_serializer_context()
        context.update({'opportunities': self.get_opportunities()})
        return context


class ImprovementToggleAPIView(ImprovementQuerySetMixin,
                                CreateModelMixin, RetrieveModelMixin,
                                DestroyModelMixin, GenericAPIView):

    serializer_class = ImprovementSerializer

    def get_object(self):
        return get_object_or_404(
            self.get_queryset(), consumption__path=self.kwargs.get('path'))

    def create(self, request, *args, **kwargs):
        consumption = get_object_or_404(Consumption.objects.all(),
            path=self.kwargs.get('path'))
        instance = self.get_queryset().filter(consumption=consumption).first()
        if instance is None:
            self.model.objects.create(
                account=self.account, consumption=consumption)
        return Response({})

    def delete(self, request, *args, **kwargs):
        return self.destroy(request, *args, **kwargs)

    def get(self, request, *args, **kwargs):
        return self.retrieve(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        return self.create(request, *args, **kwargs)
