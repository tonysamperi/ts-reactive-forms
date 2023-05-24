import {FormGroup} from "../models/form-group.class";
import {ControlContainer} from "../models/control-container.class";
import {FNS} from "../utils/form-validators.class";
import {OnDestroy, OnInit} from "../models/life-cycle.model";
import {Form} from "../models/form.interface";


/**
 * @description
 * A base class for code shared between the `NgModelGroup` and `FormGroupName` directives.
 *
 * @publicApi
 */
// @Directive()
export class AbstractFormGroupComponent extends ControlContainer implements OnInit, OnDestroy {

    /**
     * @description
     * The `FormGroup` bound to this directive.
     */
    override get control(): FormGroup {
        return this.formDirective!.getFormGroup(this);
    }

    /**
     * @description
     * The top-level directive for this group if present, otherwise null.
     */
    override get formDirective(): Form | null {
        return this._parent ? this._parent.formDirective : null;
    }

    /**
     * @description
     * The path to this group from the top-level directive.
     */
    override get path(): string[] {
        return FNS.controlPath(this.name == null ? this.name : this.name.toString(), this._parent);
    }

    /**
     * @description
     * The parent control for the group
     *
     * @internal
     */
        // TODO(issue/24571): remove '!'.
        // eslint-disable-next-line @typescript-eslint/naming-convention
    _parent!: ControlContainer;

    /** @internal */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _checkParentType(): void {
    }

    /** @nodoc */
    onDestroy(): void {
        if (this.formDirective) {
            // Remove the group from its parent group.
            this.formDirective.removeFormGroup(this);
        }
    }


    /** @nodoc */
    onInit(): void {
        this._checkParentType();
        // Register the group with its parent group.
        this.formDirective!.addFormGroup(this);
    }

}
