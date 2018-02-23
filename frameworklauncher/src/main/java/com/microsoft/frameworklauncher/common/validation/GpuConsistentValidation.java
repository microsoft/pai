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

import com.microsoft.frameworklauncher.common.exts.CommonExts;
import com.microsoft.frameworklauncher.common.model.ResourceDescriptor;

import javax.validation.Constraint;
import javax.validation.ConstraintValidator;
import javax.validation.ConstraintValidatorContext;
import javax.validation.Payload;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;

import static java.lang.annotation.ElementType.FIELD;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

@Target({FIELD})
@Retention(RUNTIME)
@Constraint(validatedBy = {GpuConsistentValidation.Validator.class})
public @interface GpuConsistentValidation {

  String message() default "{com.microsoft.frameworklauncher.common.validation.GpuConsistentValidation.message}";

  Class<?>[] groups() default {};

  Class<? extends Payload>[] payload() default {};

  @Target({FIELD})
  @Retention(RUNTIME)
  @interface List {
    GpuConsistentValidation[] value();
  }

  public static class Validator implements ConstraintValidator<GpuConsistentValidation, ResourceDescriptor> {
    @Override
    public void initialize(GpuConsistentValidation constraintAnnotation) {
    }

    @Override
    public boolean isValid(ResourceDescriptor r, ConstraintValidatorContext context) {
      // Not null is already handled by NotNull validator
      if (r == null || r.getGpuNumber() == null || r.getGpuAttribute() == null) {
        return true;
      }

      if (r.getGpuAttribute() != 0 && Long.bitCount(r.getGpuAttribute()) != r.getGpuNumber()) {
        context.disableDefaultConstraintViolation();
        String notValidMessage = String.format(
            "GpuNumber [%s] is not consistent with GpuAttribute [%s]",
            r.getGpuNumber(), CommonExts.toStringWithBits(r.getGpuAttribute()));
        context.buildConstraintViolationWithTemplate(notValidMessage).addConstraintViolation();
        return false;
      } else {
        return true;
      }
    }
  }
}
