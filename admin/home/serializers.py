from rest_framework import serializers
from .models import UserTable, SubscriptionPlan, Customer


class UserTableSerializer(serializers.ModelSerializer):
    customer_count = serializers.SerializerMethodField()

    class Meta:
        model = UserTable
        fields = [
            "mobile",
            "name",
            "referral_code",
            "is_deleted",
            "registered_at",
            "customer_count",
        ]

    def get_customer_count(self, obj):
        return Customer.objects.filter(added_under=obj.mobile).count()


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = [
            "id",
            "plan_name",
            "price",
            "validity",
            "access_type",
            "customer_limit",
            "supplier_limit",
            "transaction_limit",
            "description",
            "is_deleted",
            "created_at",
            "updated_at",
        ]


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            "customer_id",
            "mobile",
            "name",
            "added_under",
            "is_deleted",
            "added_at",
        ]
