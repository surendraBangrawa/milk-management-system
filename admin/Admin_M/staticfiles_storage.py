"""
Custom static files storage to suppress duplicate file warnings.
These warnings are normal when multiple Django apps provide static files
with the same paths (e.g., django.contrib.admin and rest_framework).
"""
from django.contrib.staticfiles.storage import StaticFilesStorage
from django.core.files.storage import get_storage_class


class QuietStaticFilesStorage(StaticFilesStorage):
    """
    A static files storage that suppresses duplicate file warnings.
    Django's default behavior is to use the first file found when duplicates exist,
    which is typically the correct behavior.
    """
    
    def post_process(self, paths, dry_run=False, **options):
        """
        Override post_process to suppress duplicate warnings.
        We still process files normally but don't warn about duplicates.
        """
        # Call the parent method but suppress duplicate warnings
        # by filtering out the warning messages
        import warnings
        with warnings.catch_warnings():
            warnings.filterwarnings('ignore', message='.*Found another file with the destination path.*')
            return super().post_process(paths, dry_run=dry_run, **options)

