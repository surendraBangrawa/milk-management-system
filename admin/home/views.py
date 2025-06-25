from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login, logout
import base64
import os
from django.conf import settings
from django.http import HttpResponse


def login_view(request):
    try:
        nonce = base64.b64encode(os.urandom(16)).decode('utf-8')
        if request.user.is_authenticated:
            return redirect('users')
        if request.method == 'POST':
            username = request.POST.get('username')
            password = request.POST.get('password')
            user = authenticate(request, username=username, password=password)
            if user is not None:
                # Fix: Pass request object as first argument
                login(request, user)
                return redirect('users')
        return render(request, 'login.html', {'nonceValue': nonce})
    except Exception as e:
        print(str(e))
        return render(request, 'login.html', {'nonceValue': nonce})


@login_required
def users(request):
    nonce = base64.b64encode(os.urandom(16)).decode('utf-8')
    return render(request, 'users.html', {'nonceValue': nonce})

@login_required
def subscription(request):
    nonce = base64.b64encode(os.urandom(16)).decode('utf-8')
    return render(request, 'subscription.html', {'nonceValue': nonce})


# @login_required
# def withdraw(request):
#     nonce = base64.b64encode(os.urandom(16)).decode('utf-8')
#     try:
#         upiIds = UpiTable.objects.all()
#         upiSerializer = UpiIDSerializer(upiIds, many=True)
#         print(upiSerializer.data)
#         return render(request, 'withdraw.html', {'upi_ids': upiSerializer.data, 'nonceValue': nonce})

#     except Exception as e:
#         return render(request, 'withdraw.html', {'nonceValue': nonce})


# @login_required
# def deposit(request):
#     nonce = base64.b64encode(os.urandom(16)).decode('utf-8')
#     return render(request, 'deposit.html', {'nonceValue': nonce})


# @login_required
# def depositWithoutUtr(request):
#     nonce = base64.b64encode(os.urandom(16)).decode('utf-8')
#     return render(request, 'deposit_blank.html', {'nonceValue': nonce})


# @login_required
# def userBets(request):
#     nonce = base64.b64encode(os.urandom(16)).decode('utf-8')
#     return render(request, 'bets_user.html', {'nonceValue': nonce})


# @login_required
# def gameControl(request):
#     try:
#         nonce = base64.b64encode(os.urandom(16)).decode('utf-8')
#         fastapi = settings.FASTAPI_API
#         return render(request, 'game.html', {'nonceValue': nonce, 'fastapi': fastapi})
#     except Exception as e:
#         return render(request, 'game.html', {'nonceValue': nonce})


# @login_required
# def transactions(request):
#     try:
#         nonce = base64.b64encode(os.urandom(16)).decode('utf-8')
#         fastapi = settings.FASTAPI_API
#         return render(request, 'transactions.html', {'nonceValue': nonce, 'fastapi': fastapi})
#     except Exception as e:
#         return render(request, 'transactions.html', {'nonceValue': nonce})


def logout_view(request):
    logout(request)
    return redirect('login')


# @login_required
# def upi(request):
#     nonce = base64.b64encode(os.urandom(16)).decode('utf-8')
#     return render(request, 'upi.html', {'nonceValue': nonce})


@login_required
def customer_list_view(request, mobile):
    nonce = base64.b64encode(os.urandom(16)).decode('utf-8')
    context = {
        'mobile': mobile,
        'nonceValue': nonce,
    }
    return render(request, 'customers_by_mobile.html', context)
