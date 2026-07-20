import { BookingWorkflow} from '../../domain/enums';
import { IBookingWorkflowDefinition, IWorkflowRegistry } from '../../domain/workflow';

export class WorkflowRegistry implements IWorkflowRegistry {
  private readonly workflowMap: Map<BookingWorkflow, IBookingWorkflowDefinition> = new Map();

  register(definition: IBookingWorkflowDefinition): void {
    this.workflowMap.set(definition.code, definition);
  }

//   resolve(code: BookingWorkflowCode): IBookingWorkflowDefinition {
//     const workflow = this.workflowMap.get(code);
//     if (!workflow) {
//       throw new Error(`Workflow not configured for code: ${code}`);
//     }

//     return workflow;
//   }

  list(): IBookingWorkflowDefinition[] {
    return Array.from(this.workflowMap.values());
  }
}
