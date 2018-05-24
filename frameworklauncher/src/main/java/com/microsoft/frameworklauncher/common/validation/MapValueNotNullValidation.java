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

import javax.validation.Constraint;
import javax.validation.ConstraintValidator;
import javax.validation.ConstraintValidatorContext;
import javax.validation.Payload;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;
import java.util.Map;

import static java.lang.annotation.ElementType.FIELD;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

@Target({FIELD})
@Retention(RUNTIME)
@Constraint(validatedBy = {MapValueNotNullValidation.Validator.class})
public @interface MapValueNotNullValidation {

  String message() default "{com.microsoft.frameworklauncher.common.validation.MapValueNotNullValidation.message}";

  Class<?>[] groups() default {};

  Class<? extends Payload>[] payload() default {};

  @Target({FIELD})
  @Retention(RUNTIME)
  @interface List {
    MapValueNotNullValidation[] value();
  }

  public static class Validator implements ConstraintValidator<MapValueNotNullValidation, Map<?, ?>> {
    @Override
    public void initialize(MapValueNotNullValidation constraintAnnotation) {
    }

    @Override
    public boolean isValid(Map<?, ?> m, ConstraintValidatorContext context) {
      // Not null is already handled by NotNull validator
      if (m == null) {
        return true;
      }

      for (Map.Entry<?, ?> kv : m.entrySet()) {
        Object k = kv.getKey();
        Object v = kv.getValue();
        if (v == null) {
          context.disableDefaultConstraintViolation();
          String notValidMessage = String.format("Map value is null for Map key: [%s]", k);
          context.buildConstraintViolationWithTemplate(notValidMessage).addConstraintViolation();
          return false;
        }
      }

      return true;
    }
  }
}
