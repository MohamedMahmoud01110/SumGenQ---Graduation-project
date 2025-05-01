import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'app-scroll-top',
  imports: [],
  templateUrl: './scroll-top.component.html',
  styleUrl: './scroll-top.component.css'
})
export class ScrollTopComponent {


  goTop(){
    // scrollTo(0,0);
    window.scrollTo({top: 0, behavior: 'smooth'});
  }

  showBtn : boolean = false;
  @HostListener ('window:scroll') scrollTop(){
    if (window.scrollY > 500) {
      this.showBtn = true;
    }else{
      this.showBtn = false;
    }
  }

}
