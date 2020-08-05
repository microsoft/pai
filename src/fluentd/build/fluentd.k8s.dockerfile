# Copyright (c) Microsoft Corporation
# All rights reserved.
#
# MIT License
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
# documentation files (the "Software"), to deal in the Software without restriction, including without limitation
# the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
# to permit persons to whom the Software is furnished to do so, subject to the following conditions:
# The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
# BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
# NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
# DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

FROM fluent/fluentd:v1.7-1

USER root
RUN apk add --no-cache --update --virtual .build-deps \
        sudo build-base ruby-dev make gcc libc-dev postgresql-dev git \
 && apk add --no-cache --update libpq \
 && sudo gem install fluent-plugin-concat \
 && sudo gem install rake bundler pg \
 && sudo apk add ruby-bigdecimal

# Build fluent-plugin-pgjson from scratch
# Original fluent-plugin-pgjson is from https://github.com/fluent-plugins-nursery/fluent-plugin-pgjson
# Original plugin cannot retry connecting when database connection is lost, 
# and is not thread-safe. These two problems are fixed by modifying codes.
COPY src/fluent-plugin-pgjson /fluent-plugin-pgjson
RUN cd /fluent-plugin-pgjson && \
      git init && \
      git add . && \
      rake build && \
      gem install --local ./pkg/fluent-plugin-pgjson-1.0.0.gem && \
      rm -rf /fluent-plugin-pgjson

# cleanup
RUN sudo gem sources --clear-all \
 && apk del .build-deps \
 && rm -rf /tmp/* /var/tmp/* /usr/lib/ruby/gems/*/cache/*.gem

COPY build/fluent.conf /fluentd/etc/
