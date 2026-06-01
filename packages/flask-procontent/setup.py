from setuptools import setup, find_packages

with open('README.md', 'r', encoding='utf-8') as f:
    long_description = f.read()

setup(
    name='flask-procontent',
    version='1.0.0',
    description='Flask integration for ProContent Editor',
    long_description=long_description,
    long_description_content_type='text/markdown',
    author='ProContent Team',
    author_email='team@procontent.dev',
    url='https://github.com/mikadojnr/procontent-editor',
    packages=find_packages(),
    python_requires='>=3.7',
    install_requires=[
        'Flask>=2.0.0',
        'Werkzeug>=2.0.0',
    ],
    extras_require={
        'PIL': ['Pillow>=8.0.0'],
    },
    classifiers=[
        'Development Status :: 4 - Beta',
        'Environment :: Web Environment',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: MIT License',
        'Operating System :: OS Independent',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.7',
        'Programming Language :: Python :: 3.8',
        'Programming Language :: Python :: 3.9',
        'Programming Language :: Python :: 3.10',
        'Programming Language :: Python :: 3.11',
        'Topic :: Internet :: WWW/HTTP',
    ],
)
