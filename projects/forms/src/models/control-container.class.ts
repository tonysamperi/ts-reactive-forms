/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {AbstractControlComponent} from "../components/abstract-control.component";
import {Form} from "./form.interface";


/**
 * @description
 * A base class for directives that contain multiple registered instances of `NgControl`.
 * Only used by the forms module.
 *
 * @publicApi
 */
export abstract class ControlContainer extends AbstractControlComponent {

    /**
     * @description
     * The top-level form directive for the control.
     */
    get formDirective(): Form | null {
        return null;
    }

    /**
     * @description
     * The path to this group.
     */
    override get path(): string[] | null {
        return null;
    }

    /**
     * @description
     * The name for the control
     */
        // TODO(issue/24571): remove '!'.
    name!: string | number | null;
}
