import {Component, NgModule} from '@angular/core';
import {CdkTableModule} from '@angular/cdk/table';

/**
 * Basic component using `CdkTable` with an inline data source and
 * two columns.
 */
@Component({
  template: `
    <cdk-table [dataSource]="[1, 2, 3, 4, 5, 6]">
      <!-- First Column -->
      <ng-container cdkColumnDef="first">
        <cdk-header-cell *cdkHeaderCellDef>First</cdk-header-cell>
        <cdk-cell *cdkCellDef="let data">{{data}}</cdk-cell>
      </ng-container>

      <!-- Second Column -->
      <ng-container cdkColumnDef="second">
        <cdk-header-cell *cdkHeaderCellDef>Second</cdk-header-cell>
        <cdk-cell *cdkCellDef="let data">{{data}}</cdk-cell>
      </ng-container>

      <cdk-header-row *cdkHeaderRowDef="['first', 'second']"></cdk-header-row>
      <cdk-row *cdkRowDef="let row; columns: ['first', 'second'];"></cdk-row>
    </cdk-table>
  `,
})
export class TestComponent {}

@NgModule({
  imports: [CdkTableModule],
  declarations: [TestComponent],
  bootstrap: [TestComponent],
})
export class AppModule {}
