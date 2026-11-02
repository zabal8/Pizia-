from django.contrib import admin
from django.urls import include, path

urlpatterns = [

    path(
        'admin/',
        admin.site.urls
    ),
    path(
        'api/v1/',
        include('pedidos_app.api.urls')
    ),
    path(
        'api-auth/',
        include('rest_framework.urls')
    ),

    path(
        '',
        include('pedidos_app.urls')
    ),

]
