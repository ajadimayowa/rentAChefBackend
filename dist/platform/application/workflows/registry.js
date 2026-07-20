"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowRegistry = void 0;
class WorkflowRegistry {
    constructor() {
        this.workflowMap = new Map();
    }
    register(definition) {
        this.workflowMap.set(definition.code, definition);
    }
    //   resolve(code: BookingWorkflowCode): IBookingWorkflowDefinition {
    //     const workflow = this.workflowMap.get(code);
    //     if (!workflow) {
    //       throw new Error(`Workflow not configured for code: ${code}`);
    //     }
    //     return workflow;
    //   }
    list() {
        return Array.from(this.workflowMap.values());
    }
}
exports.WorkflowRegistry = WorkflowRegistry;
