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

import com.microsoft.frameworklauncher.common.model.Ports;
import com.microsoft.frameworklauncher.common.model.ResourceDescriptor;
import com.microsoft.frameworklauncher.common.model.ValueRange;
import com.microsoft.frameworklauncher.common.utils.ValueRangeUtils;

import javax.validation.Constraint;
import javax.validation.ConstraintValidator;
import javax.validation.ConstraintValidatorContext;
import javax.validation.Payload;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;
import java.util.ArrayList;
import java.util.Map;

import static java.lang.annotation.ElementType.FIELD;
import static java.lang.annotation.RetentionPolicy.RUNTIME;


@Target({FIELD})
@Retention(RUNTIME)
@Constraint(validatedBy = {PortConsistentValidation.Validator.class})

public @interface PortConsistentValidation {

  String message() default "{com.microsoft.frameworklauncher.common.validation.PortConsistentValidation.message}";

  Class<?>[] groups() default {};

  Class<? extends Payload>[] payload() default {};

  @Target({FIELD})
  @Retention(RUNTIME)
  @interface List {
    PortConsistentValidation[] value();
  }

  public static class Validator implements ConstraintValidator<PortConsistentValidation, ResourceDescriptor> {
    @Override
    public void initialize(PortConsistentValidation constraintAnnotation) {
    }

    @Override
    public boolean isValid(ResourceDescriptor r, ConstraintValidatorContext context) {
      // Not null is already handled by NotNull validator
      if (r == null || r.getPortDefinitions() == null) {
        return true;
      }

      java.util.List<ValueRange> portRangeList = new ArrayList<ValueRange>();
      Map<String, Ports> portDefinitions = r.getPortDefinitions();

      int portNumber = 0;
      for (Ports ports : portDefinitions.values()) {
        if (ports.getStart() != 0) {
          portRangeList.add(ValueRange.newInstance(ports.getStart(), ports.getStart() + ports.getCount() - 1));
        } else {
          portNumber += ports.getCount();
        }
      }

      if (portNumber > 0 && ValueRangeUtils.getValueNumber(portRangeList) > 0) {
        context.disableDefaultConstraintViolation();
        String notValidMessage = String.format(
            "illegal portDefinitions in ResourceDescriptor, \"any port\" and \"specified\" port are not allowed to coexistence");
        context.buildConstraintViolationWithTemplate(notValidMessage).addConstraintViolation();
        return false;
      }
      return true;
    }
  }
}
