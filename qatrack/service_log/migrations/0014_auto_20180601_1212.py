# -*- coding: utf-8 -*-
# Generated by Django 1.11.12 on 2018-06-01 16:12
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('service_log', '0013_auto_20180425_1625'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='grouplinkerinstance',
            options={'default_permissions': ()},
        ),
        migrations.AlterModelOptions(
            name='hours',
            options={'default_permissions': (), 'permissions': (('can_have_hours', 'Can have hours'),), 'verbose_name_plural': 'Hours'},
        ),
        migrations.AlterModelOptions(
            name='servicelog',
            options={'default_permissions': (), 'ordering': ('-datetime',)},
        ),
    ]