import os
import sys
import shutil
from openpaisdk.utils import run_command
from openpaisdk.io_utils import browser_open


try:
    import nbmerge
except:
    run_command([sys.executable, '-m pip install nbmerge'])

test_notebooks = [
    '0-install-sdk-specify-openpai-cluster.ipynb',
    '1-submit-and-query-via-command-line.ipynb',
    # '2-submit-job-from-local-notebook.ipynb',
]

merged_file = "integrated_tests.ipynb"
html_file = os.path.splitext(merged_file)[0] + '.html'
shutil.rmtree(merged_file, ignore_errors=True)
shutil.rmtree(html_file, ignore_errors=True)

# clear output for committing
for f in test_notebooks:
    os.system("jupyter nbconvert --ClearOutputPreprocessor.enabled=True --inplace %s" % f)

os.system('nbmerge %s -o %s' % (' '.join(test_notebooks), merged_file))
os.system('jupyter nbconvert --ExecutePreprocessor.timeout=-1 --ExecutePreprocessor.allow_errors=True --to html --execute %s' % merged_file)

browser_open(html_file)