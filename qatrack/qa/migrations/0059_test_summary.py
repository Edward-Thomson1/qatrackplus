# Generated by Django 2.2.18 on 2024-11-11 09:47

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('qa', '0058_testlistinstance_user_key'),
    ]

    operations = [
        migrations.AddField(
            model_name='test',
            name='summary',
            field=models.BooleanField(default=False, help_text='Display this text in the summary of reports', verbose_name='Test result in Summary'),
        ),
    ]