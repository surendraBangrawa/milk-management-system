from django.urls import path, include
from api.views import UserAdminView, SubscriptionPlanView, CustomersByMobileView

urlpatterns = [
    path("user/", UserAdminView.as_view()),
    path("subscription/", SubscriptionPlanView.as_view()),
    path('customers/<str:mobile>/', CustomersByMobileView.as_view(), name='customers_by_mobile_api'),
    # path("withdraw/", withdraw.as_view()),
    # path("deposit/", deposit.as_view()),
    # path("depositWithoutUtr/", depositWithoutUtr.as_view()),
    # path("upi/", upi.as_view()),
    # path("transactions/", transactions.as_view()),
    # path("userbets/", userBets.as_view()),
    # path("withdrawByUser/", withdrawByUser.as_view()),
    # path("depositByUser/", depositByUser.as_view()),
]

