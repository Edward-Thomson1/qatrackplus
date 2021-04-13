# Generated by Django 2.1.7 on 2019-07-30 02:28

import os

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def drop_unique(apps, schema):

    from django.db import connection, transaction
    cursor = connection.cursor()

    cursor.execute("""
        SELECT top 1
            TC.Constraint_Name
        FROM information_schema.table_constraints TC
        INNER JOIN information_schema.constraint_column_usage CC on TC.Constraint_Name = CC.Constraint_Name
        WHERE
            TC.constraint_type = 'Unique'
        AND
            TC.Constraint_Name LIKE 'service_log_grouplinkerinstance_service_event_id_group_linker%'
        ORDER BY TC.Constraint_Name"""
    )
    try:
        constraint_name = cursor.fetchone()[0]
        cursor.execute("ALTER TABLE service_log_grouplinkerinstance drop constraint %s" % constraint_name)
    except TypeError:
        pass


class Migration(migrations.Migration):

    dependencies = [
        ('service_log', '0020_auto_20190129_2119'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='servicearea',
            options={'ordering': ('name',)},
        ),
        migrations.AddField(
            model_name='grouplinker',
            name='multiple',
            field=models.BooleanField(default=False, help_text='Allow selecting multiple users when using this group linker', verbose_name='Multiple users'),
        ),
        migrations.AlterField(
            model_name='grouplinker',
            name='group',
            field=models.ForeignKey(blank=True, help_text='Select the group. Leave blank to allow choosing any user.', null=True, on_delete=django.db.models.deletion.CASCADE, to='auth.Group'),
        ),
    ]

    if "sql_server" in settings.DATABASES['default']['ENGINE']:
        operations.append(
            migrations.RunPython(drop_unique)
        )
    else:
        operations.append(
            migrations.AlterUniqueTogether(
                name='grouplinkerinstance',
                unique_together=set(),
            )
        )