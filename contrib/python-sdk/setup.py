from setuptools import setup

setup(name='openpaisdk',
      version='0.4.00',
      description='A simple SDK for OpenPAI',
      url='https://github.com/microsoft/pai/contrib/python-sdk',
      packages=['openpaisdk'],
      install_requires=[
          'requests', 'fs', 'hdfs', 'PyYAML', 'requests-toolbelt', 'html2text', 'tabulate'
      ],
      entry_points={
          'console_scripts': ['pai=openpaisdk.command_line:main_pai', 'opai=openpaisdk.command_line:main_opai'],
      },
      zip_safe=False
      )
