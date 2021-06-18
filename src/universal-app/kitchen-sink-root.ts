import {Component, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {ServerModule} from '@angular/platform-server';
import {KitchenSinkMdcModule} from './kitchen-sink-mdc/kitchen-sink-mdc';
import {KitchenSinkModule} from './kitchen-sink/kitchen-sink';

@Component({
  selector: 'kitchen-sink-root',
  template: `
    <div class="apps">
      <kitchen-sink class="kitchen-sink"></kitchen-sink>
      <kitchen-sink-mdc class="kitchen-sink"></kitchen-sink-mdc>
    </div>
  `,
  styles: [`
    .apps {
      display: flex;
      flex-direction: row;
    }
    
    .kitchen-sink {
      flex: 1;
      padding: 16px;
    }
    
    .kitchen-sink:first-child {
      border-right: 2px solid grey;
    }
  `]
})
export class KitchenSinkRoot {
}

@NgModule({
  imports: [
    BrowserModule.withServerTransition({appId: 'kitchen-sink'}),
    KitchenSinkMdcModule,
    KitchenSinkModule
  ],
  declarations: [KitchenSinkRoot],
  exports: [KitchenSinkRoot],
  bootstrap: [KitchenSinkRoot],
})
export class KitchenSinkRootModule {
}

@NgModule({
  imports: [KitchenSinkRootModule, ServerModule],
  bootstrap: [KitchenSinkRoot],
})
export class KitchenSinkRootServerModule {
}
