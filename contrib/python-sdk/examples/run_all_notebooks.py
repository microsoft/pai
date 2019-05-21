import os
import sys
import shutil
from openpaisdk.utils import run_command

try:
    import nbmerge
except:
    check_call([sys.executable, '-m pip install nbmerge'])

test_notebooks = [
    '0-install-sdk-specify-openpai-cluster.ipynb',
    '1-submit-and-query-via-command-line.ipynb',
    '2-submit-job-from-local-notebook.ipynb',
]

merged_file = "integrated_tests.ipynb"

shutil.rmtree(merged_file, ignore_errors=True)
shutil.rmtree(os.path.splitext(merged_file)[0] + '.html', ignore_errors=True)

# clear output for committing
for f in test_notebooks:
    os.system("jupyter nbconvert --ClearOutputPreprocessor.enabled=True --inplace %s" % f)

os.system('nbmerge %s -o %s' % (' '.join(test_notebooks), merged_file))
os.system('jupyter nbconvert --to html --execute %s' % merged_file)