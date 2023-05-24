import {FormControl as FormControl} from "./form-control.class";
import {FormGroup} from "./form-group.class";
import {Control} from "./control.class";
import {AbstractFormGroupComponent} from "../components/abstract-form-group.component";

/**
 * @description
 * An interface implemented by `FormGroupDirective` and `NgForm` directives.
 *
 * Only used by the `ReactiveFormsModule` and `FormsModule`.
 *
 * @publicApi
 */
export interface Form {
  /**
   * @description
   * Add a control to this form.
   *
   * @param dir The control directive to add to the form.
   */
  addControl(dir: Control): void;

  /**
   * @description
   * Remove a control from this form.
   *
   * @param dir: The control directive to remove from the form.
   */
  removeControl(dir: Control): void;

  /**
   * @description
   * The control directive from which to get the `FormControl`.
   *
   * @param dir: The control directive.
   */
  getControl(dir: Control): FormControl;

  /**
   * @description
   * Add a group of controls to this form.
   *
   * @param dir: The control group directive to add.
   */
  addFormGroup(dir: AbstractFormGroupComponent): void;

  /**
   * @description
   * Remove a group of controls to this form.
   *
   * @param dir: The control group directive to remove.
   */
  removeFormGroup(dir: AbstractFormGroupComponent): void;

  /**
   * @description
   * The `FormGroup` associated with a particular `AbstractFormGroupDirective`.
   *
   * @param dir: The form group directive from which to get the `FormGroup`.
   */
  getFormGroup(dir: AbstractFormGroupComponent): FormGroup;

  /**
   * @description
   * Update the model for a particular control with a new value.
   *
   * @param dir: The control directive to update.
   * @param value: The new value for the control.
   */
  updateModel(dir: Control, value: any): void;
}
