"""
URL configuration for Admin_M project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from home.views import login_view, users, logout_view, subscription, customer_list_view
from api.views import CustomersByMobileView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", login_view, name='login'),
    path("logout/", logout_view, name="logout"),
    path("users/", users, name='users'),
    path("subscription/", subscription, name='subscription'),
    # path("withdraw/", withdraw, name='withdraw'),
    # path("deposit/", deposit, name='deposit'),
    # path("depositBlank/", depositWithoutUtr, name='depositBlank'),
    # path("gameControl/", gameControl, name='gameControl'),
    # path("transactions/", transactions, name='transactions'),
    # path("userBets/", userBets, name='userBets'),
    # path("upi/", upi, name='upi'),
    path('customers/<str:mobile>/', customer_list_view, name='customer_list'),
    path("api/", include('api.urls')),
]
