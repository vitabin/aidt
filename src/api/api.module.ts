import { Module } from '@nestjs/common';
import { ProblemModule } from './modules/problem';
import { StudyModule } from './modules/study';
import { AssignmentModule } from './modules/assignment';
import { AssessmentModule } from './modules/assessment';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { UserModule } from './modules/user';
import { UserAchievementModule } from './modules/user_achievement';
import { FileModule } from './modules/file/file.module';
import { ReportModule } from './modules/report';
import { ConceptModule } from './modules/concept';
import { LearningModule } from './modules/learning';
import { AidtDashboardModule } from './modules/aidt_dashboard/aidt_dashboard.module';
import { BatchModule } from './modules/batch';
import { KerisModule } from './modules/keris/keris.module';
import { SystemModule } from './modules/system/system.module';
import { AnnouncementModule } from './modules/announcement';
import { ClovaModule } from './modules/clova/clova.module';
import { NotificationModule } from './modules/notification';

@Module({
  imports: [
    ProblemModule,
    StudyModule,
    AssignmentModule,
    AssessmentModule,
    DashboardModule,
    UserModule,
    UserAchievementModule,
    FileModule,
    ReportModule,
    ConceptModule,
    LearningModule,
    AidtDashboardModule,
    BatchModule,
    KerisModule,
    SystemModule,
    AnnouncementModule,
    ClovaModule,
    NotificationModule,
  ],
})
export class ApiModule {}
