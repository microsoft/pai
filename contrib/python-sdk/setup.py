from setuptools import setup

setup(name='openpaisdk',
    version='0.1',
    description='A simple SDK for OpenPAI',
    url='https://github.com/microsoft/pai/contrib/python-sdk',
    packages=['openpaisdk'],
    install_requires=[
        'requests', 'hdfs', 'yaml'
    ],
    entry_points = {
        'console_scripts': ['opai=openpaisdk.engine:main'],
    },
    zip_safe=False
)