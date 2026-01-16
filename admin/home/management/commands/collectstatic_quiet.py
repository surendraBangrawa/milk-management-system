"""
Custom collectstatic command that suppresses duplicate file warnings.
These warnings are normal when multiple Django apps provide static files
with the same paths (e.g., django.contrib.admin and rest_framework).
"""

import sys
from django.core.management.commands.collectstatic import (
    Command as CollectStaticCommand,
)


class QuietOutput:
    """
    A file-like object that filters duplicate warnings from collectstatic output.
    """

    def __init__(self, original_stream):
        self.original_stream = original_stream

    def write(self, text):
        """Write text, filtering out duplicate warnings."""
        if text:
            # Check if this line contains duplicate warnings
            lines = text.split("\n")
            for line in lines:
                if "Found another file with the destination path" in line:
                    continue
                if (
                    "It will be ignored since only the first encountered file is collected"
                    in line
                ):
                    continue
                if (
                    "If this is not what you want, make sure every static file has a unique path"
                    in line
                ):
                    continue
                # Write non-filtered lines to original stream
                if line or text.endswith("\n"):
                    self.original_stream.write(line + "\n" if line else "\n")

    def flush(self):
        """Flush the original stream."""
        self.original_stream.flush()

    def __getattr__(self, name):
        """Delegate other attributes to original stream."""
        return getattr(self.original_stream, name)


class Command(CollectStaticCommand):
    """
    Override collectstatic to suppress duplicate file warnings.
    """

    help = "Collect static files in a single location (suppresses duplicate warnings)"

    def handle(self, *args, **options):
        """
        Override handle to filter out duplicate warnings from output.
        """
        # Wrap stdout and stderr to filter warnings
        original_stdout = sys.stdout
        original_stderr = sys.stderr

        try:
            # Redirect both stdout and stderr through our filter
            sys.stdout = QuietOutput(original_stdout)
            sys.stderr = QuietOutput(original_stderr)

            # Call parent handle method
            result = super().handle(*args, **options)

            return result
        finally:
            # Restore original streams
            sys.stdout = original_stdout
            sys.stderr = original_stderr
