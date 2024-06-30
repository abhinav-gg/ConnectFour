from django.contrib import admin
from django.urls import include, path, re_path
from django.views.generic import TemplateView

urlpatterns = [
    path("dummytest/", include("dummytest.urls")),
    path("admin/", admin.site.urls),
]