"""
Custom static files storage to suppress duplicate file warnings.
These warnings are normal when multiple Django apps provide static files
with the same paths (e.g., django.contrib.admin and rest_framework).
"""

from django.contrib.staticfiles.storage import StaticFilesStorage


class QuietStaticFilesStorage(StaticFilesStorage):
    """
    A static files storage that suppresses duplicate file warnings.
    Django's default behavior is to use the first file found when duplicates exist,
    which is typically the correct behavior.

    Note: The actual warning suppression is handled by the collectstatic_quiet command
    which filters output. This class exists for compatibility with STATICFILES_STORAGE setting.
    """

    pass
