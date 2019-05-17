import os
import sys
from subprocess import check_call
try:
    import nbmerge
except:
    check_call([sys.executable, '-m pip install nbmerge'])

test_notebooks = [
    '0-install-sdk-specify-openpai-cluster.ipynb',
    '1-submit-and-query-via-command-line.ipynb',
    # '2-submit-job-from-local-notebook.ipynb',
]

merged_file = "integrated_tests.ipynb"

# clear output for committing
for f in test_notebooks:
    os.system("jupyter nbconvert --ClearOutputPreprocessor.enabled=True --inplace %s" % f)

os.system('nbmerge %s -o %s' % (' '.join(test_notebooks), merged_file))
os.system('jupyter nbconvert --to html --execute %s' % merged_file)