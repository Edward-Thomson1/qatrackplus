from django.conf import settings
from django.conf.urls import patterns, include, url
import views


urlpatterns = patterns('',
    url(r'^logout/$', 'django.contrib.auth.views.logout', {'next_page': settings.LOGIN_URL}),
    url(r'^details/$', views.AccountDetails.as_view(), name="account-details"),
    url('^', include('django.contrib.auth.urls')),
    url(r'^', include('registration.backends.default.urls')),
)
