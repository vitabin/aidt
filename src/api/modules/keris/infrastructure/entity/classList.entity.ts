import { KerisClassInfo } from '.';

export class ClassList {
  static fromJSON(body: any) {
    const classList = new ClassList();
    classList.classInfos = body.class_info;
    return classList;
  }
  classInfos?: KerisClassInfo[];
}
