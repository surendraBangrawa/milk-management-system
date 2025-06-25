from django.db import models
import uuid
from datetime import datetime

# Create your models here.


class UserTable(models.Model):
    mobile = models.CharField(max_length=10, primary_key=True)
    name = models.CharField(max_length=100)
    referral_code = models.CharField(max_length=20, null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
    registered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "users"

class SubscriptionPlan(models.Model):
    ACCESS_TYPE_CHOICES = [
        ('FULL', 'FULL'),
        ('PARTIAL', 'PARTIAL'),
    ]
    
    id = models.AutoField(primary_key=True)
    price = models.FloatField()
    validity = models.IntegerField()
    access_type = models.CharField(
        max_length=7,
        choices=ACCESS_TYPE_CHOICES,
    )
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'subscription_plan'

class Customer(models.Model):
    customer_id = models.AutoField(primary_key=True)
    mobile = models.CharField(max_length=10)
    name = models.CharField(max_length=100)
    added_under = models.CharField(max_length=255)
    is_deleted = models.BooleanField(default=False)
    added_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'customers'
