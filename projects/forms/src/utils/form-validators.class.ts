import {ValidatorFn, ValidationErrors, GenericValidatorFn, AsyncValidator, Validator} from "../models/validator.model";
import {EmailValidationProvider} from "../models/email-validation-provider.type";
import {AbstractControl} from "../models/abstract-control.class";
import {Utils} from "./utils.class";
import {AsyncValidatorFn} from "../models/validator.model";
import {AbstractControlOptions} from "../models/abstract-control-options.interface";
import {ɵRuntimeError as RuntimeError} from "../internal/runtime-error.class";
import {FormsRuntimeErrorCodes} from "../internal/forms-runtime-error-codes.enum";
import {ControlContainer} from "../models/control-container.class";
import {missingControlError, missingControlValueError, noControlsError} from "../internal/reactive-errors";
//
import {
    forkJoin,
    map,
    catchError,
    of,
    Subject,
    timer,
    takeUntil,
    switchMap,
    Observable,
    from,
    isObservable
} from "rxjs";

export const FNS = {
    /**
     * Combines two arrays of validators into one. If duplicates are provided, only one will be added.
     *
     * @param validators The new validators.
     * @param currentValidators The base array of current validators.
     * @returns An array of validators.
     */
    addValidators<T extends ValidatorFn | AsyncValidatorFn>(
        validators: T | T[], currentValidators: T | T[] | null): T[] {
        const current = FNS.makeValidatorsArray(currentValidators);
        const validatorsToAdd = FNS.makeValidatorsArray(validators);
        validatorsToAdd.forEach((v: T) => {
            // Note: if there are duplicate entries in the new validators array,
            // only the first one would be added to the current list of validators.
            // Duplicate ones would be ignored since `hasValidator` would detect
            // the presence of a validator function, and we update the current list in place.
            if (!FNS.hasValidator(current, v)) {
                current.push(v);
            }
        });
        return current;
    },
    assertAllValuesPresent(control: any, isGroup: boolean, value: any): void {
        control._forEachChild((_c_: unknown, key: string | number) => {
            if (value[key] === undefined) {
                throw new RuntimeError(
                    FormsRuntimeErrorCodes.MISSING_CONTROL_VALUE,
                    missingControlValueError(isGroup, key));
            }
        });
    },
    assertControlPresent(parent: any, isGroup: boolean, key: string | number): void {
        const controls = parent.controls as { [key: string | number]: unknown };
        const collection = isGroup ? Object.keys(controls) : controls;
        if (!collection.length) {
            throw new RuntimeError(
                FormsRuntimeErrorCodes.NO_CONTROLS,
                noControlsError(isGroup));
        }
        if (!controls[key]) {
            throw new RuntimeError(
                FormsRuntimeErrorCodes.MISSING_CONTROL,
                missingControlError(isGroup, key));
        }
    },
    /**
     * Creates async validator function by combining provided async validators.
     */
    coerceToAsyncValidator(asyncValidator?: AsyncValidatorFn | AsyncValidatorFn[] | null): AsyncValidatorFn | null {
        return Array.isArray(asyncValidator)
            ? FNS.composeAsyncValidators(asyncValidator)
            : asyncValidator || null;
    },

    /**
     * Creates validator function by combining provided validators.
     */
    coerceToValidator(validator: ValidatorFn | ValidatorFn[] | null): ValidatorFn | null {
        return Array.isArray(validator) ? FNS.composeValidators(validator) : validator || null;
    },
    /**
     * Merges synchronous validators into a single validator function.
     * See `Validators.compose` for additional information.
     */
    compose(validators: (ValidatorFn | null | undefined)[] | null): ValidatorFn | null {
        if (!validators) {
            return null;
        }
        const presentValidators: ValidatorFn[] = validators.filter((v) => Utils.isNotEmpty(v)) as ValidatorFn[];
        if (presentValidators.length == 0) {
            return null;
        }

        return function (control: AbstractControl) {
            return FNS.mergeErrors(FNS.executeValidators<ValidatorFn>(control, presentValidators));
        };
    },
    /**
     * Merges asynchronous validators into a single validator function.
     * See `Validators.composeAsync` for additional information.
     */
    composeAsync(validators: (AsyncValidatorFn | null)[]): AsyncValidatorFn | null {
        if (!validators) {
            return null;
        }
        const presentValidators: AsyncValidatorFn[] = validators.filter((v) => Utils.isNotEmpty(v)) as any;
        if (presentValidators.length == 0) {
            return null;
        }

        return function (control: AbstractControl) {
            const observables =
                FNS.executeValidators<AsyncValidatorFn>(control, presentValidators)
                    .map(FNS.toObservable);
            return forkJoin(observables)
                .pipe(map(FNS.mergeErrors));
        };
    },
    /**
     * Accepts a list of async validators of different possible shapes (`AsyncValidator` and
     * `AsyncValidatorFn`), normalizes the list (converts everything to `AsyncValidatorFn`) and merges
     * them into a single validator function.
     */
    composeAsyncValidators(validators: Array<AsyncValidator | AsyncValidatorFn>): AsyncValidatorFn | null {
        return validators != null
            ? FNS.composeAsync(FNS.normalizeValidators<AsyncValidatorFn>(validators))
            : null;
    },
    /**
     * Accepts a list of validators of different possible shapes (`Validator` and `ValidatorFn`),
     * normalizes the list (converts everything to `ValidatorFn`) and merges them into a single
     * validator function.
     */
    composeValidators(validators: Array<Validator | ValidatorFn>): ValidatorFn | null {
        return validators != null ? FNS.compose(FNS.normalizeValidators<ValidatorFn>(validators)) : null;
    },
    controlPath(name: string | null, parent: ControlContainer): string[] {
        return [...parent.path!, name!];
    },
    executeValidators<V extends GenericValidatorFn>(control: AbstractControl, validators: V[]): ReturnType<V>[] {
        return validators.map(validator => validator(control));
    },
    /**
     * Retrieves the list of raw synchronous validators attached to a given control.
     */
    getControlValidators(control: AbstractControl): ValidatorFn | ValidatorFn[] | null {
        return (control as any)._rawValidators as ValidatorFn | ValidatorFn[] | null;
    },

    /**
     * Retrieves the list of raw asynchronous validators attached to a given control.
     */
    getControlAsyncValidators(control: AbstractControl): AsyncValidatorFn | AsyncValidatorFn[] | null {
        return (control as any)._rawAsyncValidators as AsyncValidatorFn | AsyncValidatorFn[] | null;
    },

    /**
     * Determines whether a validator or validators array has a given validator.
     *
     * @param validators The validator or validators to compare against.
     * @param validator The validator to check.
     * @returns Whether the validator is present.
     */
    hasValidator<T extends ValidatorFn | AsyncValidatorFn>(
        validators: T | T[] | null, validator: T): boolean {
        return Array.isArray(validators) ? validators.includes(validator) : validators === validator;
    },
    hasValidLength(value: any): boolean {
        // non-strict comparison is intentional, to check for both `null` and `undefined` values
        return value != null && typeof value.length === "number";
    },
    isEmptyInputValue(value: any): boolean {
        // we don't check for string here, so it also works with arrays
        return value == null || value.length === 0;
    },
    isOptionsObj(validatorOrOpts?: ValidatorFn | ValidatorFn[] | AbstractControlOptions |
        null): validatorOrOpts is AbstractControlOptions {
        return validatorOrOpts != null && !Array.isArray(validatorOrOpts) &&
            typeof validatorOrOpts === "object";
    },
    isPromise(obj: any): obj is Promise<any> {
        return !!obj && typeof obj.then === "function";
    },
    isValidatorFn<V>(validator: V | Validator | AsyncValidator): validator is V {
        return !(validator as Validator).validate;
    },
    /**
     * Accepts a singleton validator, an array, or null, and returns an array type with the provided
     * validators.
     *
     * @param validators A validator, validators, or null.
     * @returns A validators array.
     */
    makeValidatorsArray<T extends ValidatorFn | AsyncValidatorFn>(validators: T | T[] |
        null): T[] {
        if (!validators) {
            return [];
        }
        return Array.isArray(validators) ? validators : [validators];
    },
    mergeErrors: (arrayOfErrors: Array<null | ValidationErrors>): ValidationErrors | null => {
        let res = {};

        // Not using Array.reduce here due to a Chrome 80 bug
        // https://bugs.chromium.org/p/chromium/issues/detail?id=1049982
        arrayOfErrors.forEach((errors) => {
            res = errors != null ? {...res, ...errors} : res;
        });

        return Object.keys(res).length === 0 ? null : res;
    },
    /**
     * Merges raw control validators with a given directive validator and returns the combined list of
     * validators as an array.
     */
    mergeValidators<V>(controlValidators: V | V[] | null, dirValidator: V): V[] {
        if (controlValidators === null) {
            return [dirValidator];
        }
        return Array.isArray(controlValidators) ? [...controlValidators, dirValidator] :
            [controlValidators, dirValidator];
    },
    /**
     * Given the list of validators that may contain both functions and classes, return the list
     * of validator functions (convert validator classes into validator functions). This is needed to
     * have consistent structure in validators list before composing them.
     *
     * @param validators The set of validators that may contain validators both in plain function form
     *     and represented as a validator class.
     */
    normalizeValidators<V>(validators: (V | Validator | AsyncValidator)[]): V[] {
        return validators.map(validator => {
            return FNS.isValidatorFn<V>(validator)
                ? validator
                : ((c: AbstractControl) => validator.validate(c)) as unknown as V;
        });
    },
    /**
     * Gets async validators from either an options object or given validators.
     */
    pickAsyncValidators(
        asyncValidator?: AsyncValidatorFn | AsyncValidatorFn[] | null,
        validatorOrOpts?: ValidatorFn | ValidatorFn[] | AbstractControlOptions | null): AsyncValidatorFn | AsyncValidatorFn[] | null {

        return (FNS.isOptionsObj(validatorOrOpts) ? validatorOrOpts.asyncValidators : asyncValidator) || null;
    },
    /**
     * Gets validators from either an options object or given validators.
     */
    pickValidators(validatorOrOpts?: ValidatorFn | ValidatorFn[] | AbstractControlOptions |
        null): ValidatorFn | ValidatorFn[] | null {
        return (FNS.isOptionsObj(validatorOrOpts) ? validatorOrOpts.validators : validatorOrOpts) || null;
    },
    removeListItem<T>(list: T[], el: T): void {
        const index = list.indexOf(el);
        if (index > -1) {
            list.splice(index, 1);
        }
    },
    removeValidators<T extends ValidatorFn | AsyncValidatorFn>(
        validators: T | T[], currentValidators: T | T[] | null): T[] {
        return FNS.makeValidatorsArray(currentValidators)
            .filter(v => !FNS.hasValidator(validators, v));
    },
    toObservable<T = any>(value: Promise<T> | Observable<T>): Observable<T> | never {
        const obs = FNS.isPromise(value) ? from(value) : value;
        if (!(isObservable(obs))) {
            let errorMessage = `Expected async validator to return Promise or Observable.`;
            // A synchronous validator will return object or null.
            if (typeof value === "object") {
                errorMessage +=
                    " Are you using a synchronous validator where an async validator is expected?";
            }
            throw new Error(errorMessage);
        }

        return obs;
    },
    // VALIDATOR FNS
    /**
     * Validator that requires the control's value pass an email validation test.
     * See `Validators.email` for additional information.
     */
    emailValidator(control: AbstractControl): ValidationErrors | null {
        if (FNS.isEmptyInputValue(control.value)) {
            return null;  // don't validate empty values to allow optional controls
        }
        return Utils.EMAIL_RE.test(control.value) ? null : {"email": true};
    },

    /**
     * Validator that requires the length of the control's value to be less than or equal
     * to the provided maximum length. See `Validators.maxLength` for additional information.
     */
    maxLengthValidator(maxLength: number): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            return FNS.hasValidLength(control.value) && control.value.length > maxLength ?
                {
                    "maxlength": {
                        "requiredLength": maxLength,
                        "actualLength": control.value.length
                    }
                } :
                null;
        };
    },
    /**
     * Validator that requires the control's value to be less than or equal to the provided number.
     * See `Validators.max` for additional information.
     */
    maxValidator(max: number): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (FNS.isEmptyInputValue(control.value) || FNS.isEmptyInputValue(max)) {
                return null;  // don't validate empty values to allow optional controls
            }
            const value = parseFloat(control.value);
            // Controls with NaN values after parsing should be treated as not having a
            // maximum, per the HTML forms spec: https://www.w3.org/TR/html5/forms.html#attr-input-max
            return !isNaN(value) && value > max ? {
                "max": {
                    "max": max,
                    "actual": control.value
                }
            } : null;
        };
    },
    /**
     * Validator that requires the control's value to be greater than or equal to the provided number.
     * See `Validators.min` for additional information.
     */
    /**
     * Validator that requires the length of the control's value to be greater than or equal
     * to the provided minimum length. See `Validators.minLength` for additional information.
     */
    minLengthValidator(minLength: number): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (FNS.isEmptyInputValue(control.value) || !FNS.hasValidLength(control.value)) {
                // don't validate empty values to allow optional controls
                // don't validate values without `length` property
                return null;
            }

            return control.value.length < minLength ?
                {
                    "minlength": {
                        "requiredLength": minLength,
                        "actualLength": control.value.length
                    }
                } :
                null;
        };
    },
    minValidator(min: number): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (FNS.isEmptyInputValue(control.value) || FNS.isEmptyInputValue(min)) {
                return null;  // don't validate empty values to allow optional controls
            }
            const value = parseFloat(control.value);
            // Controls with NaN values after parsing should be treated as not having a
            // minimum, per the HTML forms spec: https://www.w3.org/TR/html5/forms.html#attr-input-min
            return !isNaN(value) && value < min ? {
                "min": {
                    "min": min,
                    "actual": control.value
                }
            } : null;
        };
    },

    /**
     * Function that has `ValidatorFn` shape, but performs no operation.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    nullValidator(_control_: AbstractControl): null {
        return null;
    },
    /**
     * Validator that requires the control's value to match a regex pattern.
     * See `Validators.pattern` for additional information.
     */
    patternValidator(pattern: string | RegExp): ValidatorFn {
        if (!pattern) {
            return FNS.nullValidator;
        }
        let regex: RegExp;
        let regexStr: string;
        if (typeof pattern === "string") {
            regexStr = "";

            if (pattern.charAt(0) !== "^") {
                regexStr += "^";
            }

            regexStr += pattern;

            if (pattern.charAt(pattern.length - 1) !== "$") {
                regexStr += "$";
            }

            regex = new RegExp(regexStr);
        }
        else {
            regexStr = pattern.toString();
            regex = pattern;
        }
        return (control: AbstractControl): ValidationErrors | null => {
            if (FNS.isEmptyInputValue(control.value)) {
                return null;  // don't validate empty values to allow optional controls
            }
            const value: string = control.value;
            return regex.test(value) ? null :
                {
                    "pattern": {
                        "requiredPattern": regexStr,
                        "actualValue": value
                    }
                };
        };
    },
    /**
     * Validator that requires the control's value be true. This validator is commonly
     * used for required checkboxes.
     * See `Validators.requiredTrue` for additional information.
     */
    requiredTrueValidator(control: AbstractControl): ValidationErrors | null {
        return control.value === true ? null : {"required": true};
    },
    /**
     * Validator that requires the control have a non-empty value.
     * See `Validators.required` for additional information.
     */
    requiredValidator(control: AbstractControl): ValidationErrors | null {
        return FNS.isEmptyInputValue(control.value) ? {"required": true} : null;
    }
};

export class FormValidators {

    /**
     *
     * @param debounceTime optional delay for call. Defaults to 350 ms
     * @param validators optional validators to run against. Default all of MC validators
     * @param validationServiceProvider
     * @returns {(function(*): (null|Observable<null|{validateMail: boolean}>))|*}
     */
    static asyncValidateEmail<T = any>(validationServiceProvider: EmailValidationProvider,
                                       debounceTime = 300): ValidatorFn {
        return function (this: any, control: AbstractControl): null | Observable<ValidationErrors | null> {
            if (FNS.isEmptyInputValue(control.value)) {
                return null;  // don't validate empty values to allow optional controls
            }
            this._debounceCtrl$ || (this._debounceCtrl$ = new Subject<void>());
            this._debounceCtrl$.next();

            return timer(debounceTime)
                .pipe(
                    takeUntil(this._debounceCtrl$),
                    switchMap(() => {
                        return validationServiceProvider(control.value)
                            .pipe(
                                map((valid) => {
                                    return valid ? null : {asyncValidateMail: true};
                                }),
                                catchError(() => {
                                    return of({asyncValidateMail: true});
                                })
                            );
                    })
                );
        }.bind({});
    }

    /**
     * @description
     * Compose multiple validators into a single function that returns the union
     * of the individual error maps for the provided control.
     *
     * @returns A validator function that returns an error map with the
     * merged error maps of the validators if the validation check fails, otherwise `null`.
     *
     * @see `updateValueAndValidity()`
     *
     */
    static compose(validators: null): null;
    static compose(validators: (ValidatorFn | null | undefined)[]): ValidatorFn | null;
    static compose(validators: (ValidatorFn | null | undefined)[] | null): ValidatorFn | null {
        return FNS.compose(validators);
    }

    /**
     * @description
     * Compose multiple async validators into a single function that returns the union
     * of the individual error objects for the provided control.
     *
     * @returns A validator function that returns an error map with the
     * merged error objects of the async validators if the validation check fails, otherwise `null`.
     *
     * @see `updateValueAndValidity()`
     *
     */
    static composeAsync(validators: (AsyncValidatorFn | null)[]): AsyncValidatorFn | null {
        return FNS.composeAsync(validators);
    }

    /**
     *
     * @param control: AbstractControl
     * @returns {null|{email: boolean}}
     */
    static email(control: AbstractControl): ValidationErrors | null {
        return FNS.emailValidator(control);
    }

    static equality(keys: string[]): ValidationErrors | null {
        Utils.isArrayOrError(keys);
        Utils.isTruthyOrError(keys.length > 1);

        return (formGroup: AbstractControl) => {
            const hasError = keys.slice(1)
                .some(k => {
                    return formGroup.get(keys[0])?.value !== formGroup.get(k)?.value;
                });

            return hasError ? {equality: !0} : null;
        };
    }

    /**
     * @description
     * Validator that requires the control's value to be less than or equal to the provided number.
     *
     * @usageNotes
     *
     * ### Validate against a maximum of 15
     *
     * ```typescript
     * const control = new FormControl(16, Validators.max(15));
     *
     * console.log(control.errors); // {max: {max: 15, actual: 16}}
     * ```
     *
     * @returns A validator function that returns an error map with the
     * `max` property if the validation check fails, otherwise `null`.
     *
     * @see `updateValueAndValidity()`
     *
     */
    static max(max: number): ValidatorFn {
        return FNS.maxValidator(max);
    }

    /**
     * @description
     * Validator that requires the length of the control's value to be less than or equal
     * to the provided maximum length. This validator is also provided by default if you use the
     * the HTML5 `maxlength` attribute. Note that the `maxLength` validator is intended to be used
     * only for types that have a numeric `length` property, such as strings or arrays.
     *
     * @usageNotes
     *
     * ### Validate that the field has maximum of 5 characters
     *
     * ```typescript
     * const control = new FormControl('Angular', Validators.maxLength(5));
     *
     * console.log(control.errors); // {maxlength: {requiredLength: 5, actualLength: 7}}
     * ```
     *
     * ```html
     * <input maxlength="5">
     * ```
     *
     * @returns A validator function that returns an error map with the
     * `maxlength` property if the validation check fails, otherwise `null`.
     *
     * @see `updateValueAndValidity()`
     *
     */
    static maxLength(maxLength: number): ValidatorFn {
        return FNS.maxLengthValidator(maxLength);
    }

    /**
     * @description
     * Validator that requires the control's value to be greater than or equal to the provided number.
     *
     * @usageNotes
     *
     * ### Validate against a minimum of 3
     *
     * ```typescript
     * const control = new FormControl(2, Validators.min(3));
     *
     * console.log(control.errors); // {min: {min: 3, actual: 2}}
     * ```
     *
     * @returns A validator function that returns an error map with the
     * `min` property if the validation check fails, otherwise `null`.
     *
     * @see `updateValueAndValidity()`
     *
     */
    static min(min: number): ValidatorFn {
        return FNS.minValidator(min);
    }


    /**
     * @description
     * Validator that requires the length of the control's value to be greater than or equal
     * to the provided minimum length. This validator is also provided by default if you use the
     * the HTML5 `minlength` attribute. Note that the `minLength` validator is intended to be used
     * only for types that have a numeric `length` property, such as strings or arrays. The
     * `minLength` validator logic is also not invoked for values when their `length` property is 0
     * (for example in case of an empty string or an empty array), to support optional controls. You
     * can use the standard `required` validator if empty values should not be considered valid.
     *
     * @usageNotes
     *
     * ### Validate that the field has a minimum of 3 characters
     *
     * ```typescript
     * const control = new FormControl('ng', Validators.minLength(3));
     *
     * console.log(control.errors); // {minlength: {requiredLength: 3, actualLength: 2}}
     * ```
     *
     * ```html
     * <input minlength="5">
     * ```
     *
     * @returns A validator function that returns an error map with the
     * `minlength` property if the validation check fails, otherwise `null`.
     *
     * @see `updateValueAndValidity()`
     *
     */
    static minLength(minLength: number): ValidatorFn {
        return FNS.minLengthValidator(minLength);
    }

    /**
     * Function that has `ValidatorFn` shape, but performs no operation.
     * @param control: FormGroup | FormControl
     * @returns {null}
     */
    // eslint-disable-next-line no-unused-vars
    static nullValidator(control: AbstractControl): null {
        return FNS.nullValidator(control);
    }

    /**
     *
     * @param pattern: string | RegExp
     * @returns ValidatorFn
     */
    static pattern(pattern: string | RegExp): ValidatorFn {
        if (!pattern) {
            return this.nullValidator;
        }
        let regex: RegExp;
        let regexStr: string;
        if (Utils.isString(pattern)) {
            regexStr = "";

            if (pattern.charAt(0) !== "^") {
                regexStr += "^";
            }

            regexStr += pattern;

            if (pattern.charAt(pattern.length - 1) !== "$") {
                regexStr += "$";
            }

            regex = new RegExp(regexStr);
        }
        else {
            regexStr = pattern.toString();
            regex = pattern;
        }
        return (control: AbstractControl) => {
            if (FNS.isEmptyInputValue(control.value)) {
                return null;  // don't validate empty values to allow optional controls
            }
            const value = control.value;
            return regex.test(value)
                ? null
                : {
                    "pattern": {
                        "requiredPattern": regexStr,
                        "actualValue": value
                    }
                };
        };
    }

    static required(control: AbstractControl): ValidationErrors | null {
        return FNS.requiredValidator(control);
    }

    /**
     * @description
     * Validator that requires the control's value be true. This validator is commonly
     * used for required checkboxes.
     *
     * @usageNotes
     *
     * ### Validate that the field value is true
     *
     * ```typescript
     * const control = new FormControl('some value', Validators.requiredTrue);
     *
     * console.log(control.errors); // {required: true}
     * ```
     *
     * @returns An error map that contains the `required` property
     * set to `true` if the validation check fails, otherwise `null`.
     *
     * @see `updateValueAndValidity()`
     *
     */
    static requiredTrue(control: AbstractControl): ValidationErrors | null {
        return FNS.requiredTrueValidator(control);
    }

}
