// Copyright (c) Microsoft Corporation
// All rights reserved. 
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated 
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation 
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and 
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING 
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND 
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, 
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. 

package com.microsoft.frameworklauncher.common.validation;

import com.microsoft.frameworklauncher.common.exceptions.BadRequestException;

import javax.validation.ConstraintViolation;
import javax.validation.ConstraintViolationException;
import javax.validation.Validation;
import javax.validation.Validator;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class CommonValidation {
  // Only accept unreserved characters defined in URI:
  // ALPHA / DIGIT / "-" / "." / "_" / "~"
  // See https://tools.ietf.org/html/rfc3986#section-2.3

  // Accept all uppercase and lowercase letters, decimal digits, hyphen, period, underscore, and tilde
  public static final String NAMING_CONVENTION_REGEX_STR = "^[A-Za-z0-9\\-._~]{1,256}$";
  public static final Pattern NAMING_CONVENTION_REGEX = Pattern.compile(NAMING_CONVENTION_REGEX_STR);
  public static final String NAMESPACE_NAMING_CONVENTION_REGEX_STR = "^([^~]+)~([^~]+)$";
  public static final Pattern NAMESPACE_NAMING_CONVENTION_REGEX = Pattern.compile(NAMESPACE_NAMING_CONVENTION_REGEX_STR);
  private static final Validator VALIDATOR = Validation.buildDefaultValidatorFactory().getValidator();

  public static <T> void validate(T o) throws BadRequestException {
    if (o == null) {
      throw new BadRequestException("Object is null");
    }

    Set<ConstraintViolation<T>> violations = VALIDATOR.validate(o);
    if (!violations.isEmpty()) {
      throw new BadRequestException(new ConstraintViolationException(violations));
    }
  }

  public static void validate(String s) throws BadRequestException {
    if (s == null) {
      throw new BadRequestException("Object is null");
    }

    if (!NAMING_CONVENTION_REGEX.matcher(s).matches()) {
      throw new BadRequestException(String.format(
          "Name [%s] is not matched with naming convention regex [%s]",
          s, NAMING_CONVENTION_REGEX));
    }
  }

  public static String validateAndGetNamespace(String frameworkName) throws BadRequestException {
    if (frameworkName == null) {
      throw new BadRequestException("Object is null");
    }

    Matcher matcher = NAMESPACE_NAMING_CONVENTION_REGEX.matcher(frameworkName);
    if (!matcher.matches()) {
      throw new BadRequestException(String.format(
          "Name [%s] is not matched with naming convention regex [%s]",
          frameworkName, NAMESPACE_NAMING_CONVENTION_REGEX));
    }

    return matcher.group(1);
  }
}
