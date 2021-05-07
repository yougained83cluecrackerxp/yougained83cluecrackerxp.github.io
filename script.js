// Hammer.plugins.showTouches();

// if(!Hammer.HAS_TOUCHEVENTS && !Hammer.HAS_POINTEREVENTS) {
//   Hammer.plugins.fakeMultitouch();
// }

function ZoomPanView(img_url, thumb_url) {
  
  this.el_wrapper = $("<div />", {
    class: 'pan-image'
  });
  this.el_img = $("<img/>");
  this.el_imgNav = $('#annotation-list');
  this.img_src = img_url;
  this.thumb_src = thumb_url;
  this.thumbScale = 1;
  this.actualWidth = 0;
  this.actualHeight = 0;
  this.scaleX = 1;
  this.scaleY = 1;
  this.translateX = 0;
  this.translateY = 0;
  this.centerMatrix = { };
  this.annotations = [
    {
      id: "ann2",
      title: "Prehistoric Koala",
      x: 2300,
      y: 2150,
      scale: 1,
      content: "As you can see, the Prehistoric Koala is frightened by the mosh pit and running in a separate direction. Most likely towards Australia."
    },{
      id: "ann3",
      title: "Thrashing",
      x: 3450,
      y: 1450,
      scale: 0.9,
      content: "It is commonly believed that thrash's origins were rooted in the mid to late 70's; this is not the case. Here an Ankylosaur is seen thrashing in the late Cretaceous period."
    },{
      id: "ann4",
      title: "Mosh Pit",
      x: 1400,
      y: 1450,
      scale: 0.3,
      content: "Though it may look scary, most of these dinosaurs are having the best time."
    },{
      id: "ann5",
      title: "Invisible Keyboard",
      x: 4000,
      y: 850,
      scale: 0.8,
      content: "After millions of years of evolution, Tyrannosaurs were perfectly suited as keyboardists and lead singers."
    }
  ];
  
  var self = this;
  
  this.init = function() {
    this.el_img.attr("src", this.img_src).load(function() {
        
        var win_width = $(window).width();
        
        self.actualWidth = this.width;
        self.actualHeight = this.height;
        //console.log("Actual dimensions: " + this.width + "x" + this.height);
      
        self.thumbScale = 800/this.width;
      
        self.scaleX = self.scaleY = win_width/self.actualWidth;
        //self.translateX = (-self.actualWidth/2)+(win_width/2);
         
        var defaultTrans = self.getResetTransform(); 
        self.setTransform(defaultTrans.scale, defaultTrans.translateX, defaultTrans.translateY);
  
        
        // set the css an add to DOM
        self.el_wrapper.css({
          'width' : self.actualWidth+'px',
          'height' : self.actualHeight+'px'
        }).append(this).appendTo('.app-wrapper'); 
      
        // populate the annotation list
        for(i=0; i<self.annotations.length; i++) {
          var ann = self.annotations[i];        
          var annLink = $("<a />", {
            class: 'annotation-link',
            id: ann.id
          });
          annLink.append(
              '<span class="image-preview" style="'
              + 'background-image:url('+ self.thumb_src+ '); '
              + 'background-position: ' + (-ann.x*self.thumbScale) + 'px '+ (-ann.y*self.thumbScale) + 'px' 
            + '"></span>'
            + '<span class="image-label">'+ann.title+'</span>'
          );
          annLink.data('xpos',ann.x);
          annLink.data('ypos',ann.y);
          annLink.data('scale',ann.scale);
          annLink.data('content-id', ann.id+'-content');
          $('body').append('<div id="'+ann.id+'-content" class="hidden">'+ann.content+'</div>');
          annLink.on('tap click', function() { 
            $('.image-nav').removeClass('on');
            $('.pan-image').css({
              '-webkit-transition': 'all 2s cubic-bezier(.5,0,.5,1)'
            });
             
            var annID = $(this).data('content-id');
            setTimeout(function() {
              $('.pan-image').css({
                '-webkit-transition': 'all 0.35s cubic-bezier(0,0,0,1)'
              });
              $('#contentBox').html($('#'+annID).html()); 
              $('#contentBox').addClass('on');
            },2000);
            self.zoomToLocation($(this).data('xpos'),$(this).data('ypos'),$(this).data('scale'));
          });
          $('<li />').append(annLink).appendTo(self.el_imgNav);
        }
        
       
        // touch events on body
        var hammertime = Hammer(document.body, { 
          transform_always_block: true,
          transform_min_scale: 0.5
        });
      
        var startTransform, endTransform;
      
        var midX = 0;
        var midY = 0; 
      
        var isTransitioning;
       
        hammertime.on('touch drag transform doubletap', function(ev) {
          switch(ev.type) {
              case 'touch':  
                startTransform = { 
                  scale: self.scaleX, 
                  translateX: self.translateX, 
                  translateY: self.translateY
                };
                endTransform = { 
                  scale: self.scaleX, 
                  translateX: self.translateX, 
                  translateY: self.translateY
                };
              break;  
      
              case 'drag':
                  endTransform.translateX = (startTransform.translateX+ev.gesture.deltaX);
                  endTransform.translateY = (startTransform.translateY+ev.gesture.deltaY);
                  ev.gesture.preventDefault();
              break;
              
              case 'doubletap':
                var scaleAmount = self.scaleX*2.5;
                var isInside = self.isPointInside(ev.gesture.touches[0].pageX,
                  ev.gesture.touches[0].pageY);
              
                  if(!isInside) {
                    endTransform = self.getResetTransform();
                  } else {
                    endTransform = self.getTransformAfterScale(
                      ev.gesture.touches[0].pageX,
                      ev.gesture.touches[0].pageY,
                      scaleAmount
                    );
                  }
       
              break;
               
              case 'transform':
                  if(ev.gesture.touches.length==2) {
                    midX = (ev.gesture.touches[0].pageX+ev.gesture.touches[1].pageX)/2;
                    midY = (ev.gesture.touches[0].pageY+ev.gesture.touches[1].pageY)/2;
                  }
                  endTransform = self.getTransformAfterScale(
                      midX,
                      midY,
                      (startTransform.scale*ev.gesture.scale)
                    );
              startTransform.translateX = endTransform.translateX;
                  startTransform.translateY = endTransform.translateY;
                  ev.gesture.preventDefault();
              break;
          }; 
       
          self.setTransform(
              endTransform.scale, 
              endTransform.translateX, 
              endTransform.translateY
            );

          
          //console.log(self.getBoundingBox());
        });
      
        $('body').bind('mousewheel',
          function(event, delta, deltaX, deltaY) {
            var factor = deltaY > 0 ? 1.05 : 0.95;
            var et = self.getTransformAfterScale(event.pageX, event.pageY, self.scaleX*factor);
            self.setTransform(et.scale,et.translateX,et.translateY);
          }
        );
    });
  };
  
  this.getVirtualValue = function(screenVal) {
    return screenVal/this.scaleX;
  };
  
  this.getScreenValue = function(virtualVal) {
    return virtualVal*this.scaleX; 
  };
   
  this.getTransformString = function() {
    return "matrix("+this.scaleX+", 0, 0, "+this.scaleY+", "+this.translateX+", "+this.translateY+")";
  };
  
  
  
  this.getTransformAfterScale = function(x, y, scale) { 

    scale = Math.max(Math.min(scale,2), 0.05); // TODO: update with min / max options
  
    // find cursor offset within the element
    x -= this.translateX;
    y -= this.translateY;
   
    // find the final position of the coordinate after scaling
    var xf = x * scale / this.scaleX;
    var yf = y * scale / this.scaleY;
  
    // find the difference between the initial and final position
    // and add the difference to the current position.
    var dx = this.translateX + x - xf;
    var dy = this.translateY + y - yf;
  
    return {
      scale: scale,
      translateX: dx,
      translateY: dy
    };
  }; 
  
  this.getBoundingBox = function() {
    var c_width = this.scaleX * this.actualWidth;
    var c_height = this.scaleY * this.actualHeight;
    var c_top = this.translateY;
    var c_left = this.translateX;
   
    //console.log(c_translateX);
    
    return {
      top: c_top,
      right: (c_left+c_width),
      bottom: (c_top+c_height),
      left: c_left
    }
  };
  
  this.getVisibleBox = function() {
    
  };
  
  this.getResetTransform = function() {
    var targetScale = $(window).width()/this.actualWidth;
    var targetTranslateY = $(window).height()/2-this.actualHeight*targetScale/2;
    return {
      scale: targetScale,
      translateX: 0,
      translateY: targetTranslateY
    };
  };
  
  this.zoomToLocation = function(x,y,scale) {
    var finalWidth = this.actualWidth * scale;
    var finalHeight = this.actualHeight * scale;
    var finalX = (-x*scale)+$(window).width()/2;
    var finalY = (-y*scale)+$(window).height()/2;
    this.setTransform(scale,finalX,finalY);
  };
  
  this.isPointInside = function(x,y) {
    var rect = this.getBoundingBox();
    return (x > rect.left && x < rect.right && y > rect.top && y < rect.bottom )
  };
  
  this.setTransform = function(scale, transX, transY) {
    this.translateX = transX;
    this.translateY = transY;
    this.scaleX = scale;
    this.scaleY = scale;
    
    var transformString = this.getTransformString();
    
    this.el_wrapper.css({
          'transform' : transformString,
          '-webkit-transform' : transformString,
          '-moz-transform' : transformString,
          '-ms-transform' : transformString,
          '-o-transform' : transformString
    });
  };
  
  this.init();
 
}

  $(document).ready(function() {
    window.zpview = new ZoomPanView(
      "guestbookfornar.png", 
      "guestbookfornar.png"
    );
    
    $('#menu-button').on('click', function() {
      $('#contentBox').removeClass('on');
      $('.image-nav').toggleClass('on');
      $(this).toggleClass('active');
    });
    
    $('#home-button').on('click', function() {
      alert("This doesn't do anything yet!");
    });
  });