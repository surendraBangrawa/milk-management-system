"""
Custom collectstatic command that suppresses duplicate file warnings.
These warnings are normal when multiple Django apps provide static files
with the same paths (e.g., django.contrib.admin and rest_framework).
"""

import sys
import warnings
from django.contrib.staticfiles.management.commands.collectstatic import (
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
        if not text:
            return

        # Normalize text for case-insensitive matching
        text_lower = text.lower()

        # Check if entire text block contains duplicate warnings (skip it entirely)
        if "found another file with the destination path" in text_lower:
            return
        if (
            "it will be ignored since only the first encountered file is collected"
            in text_lower
        ):
            return
        if (
            "if this is not what you want, make sure every static file has a unique path"
            in text_lower
        ):
            return

        # Also filter line by line for partial matches
        lines = text.split("\n")
        filtered_lines = []

        for line in lines:
            line_lower = line.lower()
            # Skip lines with duplicate warnings (case-insensitive)
            if "found another file with the destination path" in line_lower:
                continue
            if (
                "it will be ignored since only the first encountered file is collected"
                in line_lower
            ):
                continue
            if (
                "if this is not what you want, make sure every static file has a unique path"
                in line_lower
            ):
                continue
            # Keep all other lines
            filtered_lines.append(line)

        # Write filtered lines
        if filtered_lines:
            output = "\n".join(filtered_lines)
            if text.endswith("\n") and not output.endswith("\n"):
                output += "\n"
            self.original_stream.write(output)

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
        # Suppress Python warnings about duplicate files
        with warnings.catch_warnings():
            warnings.filterwarnings(
                "ignore",
                message=".*Found another file with the destination path.*",
                category=UserWarning,
            )
            warnings.filterwarnings(
                "ignore",
                message=".*It will be ignored since only the first encountered file is collected.*",
                category=UserWarning,
            )
            warnings.filterwarnings(
                "ignore",
                message=".*If this is not what you want, make sure every static file has a unique path.*",
                category=UserWarning,
            )

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
