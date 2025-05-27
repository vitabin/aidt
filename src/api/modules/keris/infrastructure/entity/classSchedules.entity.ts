import { ScheduleInfo } from '.';

export class ClassSchedules {
  static fromJSON(body: any): ClassSchedules | PromiseLike<ClassSchedules> {
    const classSchedules = new ClassSchedules();
    classSchedules.schedule_infos = body.schedule_info;
    return classSchedules;
  }
  schedule_infos!: ScheduleInfo[];
}
