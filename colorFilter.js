/* 2015/10/27 kyoshida
 *
 * 使い方
 * colorFilter.effectBinarize(Context)でContextのImageDataを白黒にして反映,過去3件保存
 * colorFilter.captureImage(Context)で差分画像を取得,現在選択している色情報と共に保存
 * colorFilter.compositImage(Context)で差分画像に色情報を適用し合成して,入力のコンテキストに反映
 * 
 * TODO
 *  ノイズ処理を行っていない
 */


var colorFilter = (function(){
    var module = {};
    module.colorKey = 0;//0:黒,1:赤,2:緑,3:青
    module.threshold = 180;
    module.imageDataStack = [];
    module.colorDataStack = [];
    module.iBoardImageData= [];
    module.instantImageDataStack=[];
    module.getColor = function(colorNumber){
        switch(colorNumber){
                case 0:
                //黒
                return {r:0,g:0,b:0};
                case 1:
                //赤
                return {r:255,g:0,b:0};
                case 2:
                //緑
                return {r:0,g:255,b:0};
                case 3:
                //青
                return {r:0,g:0,b:255};
                default:
                //白
                return {r:255,g:255,b:255};
        }
    };

    /**
     * 画像の切り出しと差分計算と保存
     * @param  {[type]} context [description]
     * @return {[type]}         [description]
     */
    module.captureImage = function(context){
        var imageData = context.getImageData(0,0,canvas.width,canvas.height),
        data = imageData.data;
        var canvasElement = document.createElement('canvas');
        canvasElement.width=canvas.width;
        canvasElement.height = canvas.height;
        var ctx = canvasElement.getContext('2d');

        //分解してimageDataStackに保管
        var currentImageData = module.instantImageDataStack.pop();
        currentImageData.data = module.getDistance(currentImageData);
        module.imageDataStack.push(currentImageData);
        module.colorDataStack.push(module.getColor(module.colorKey));
        ctx.putImageData(currentImageData,0,0);
        document.body.appendChild(canvasElement);       
    }

    module.compositImage = function(context){
        console.log(module.colorDataStack);
        var imageData = context.getImageData(0,0,canvas.width,canvas.height);
        var data = imageData.data;
        var colorImageDataStack = [];
        for(var i=0;i<module.imageDataStack.length;i++){
            colorImageDataStack.push(module.selectColorFilter(module.imageDataStack[i],module.colorDataStack[i]));
        }

        for(var i=0;i<data.length;i=i+4){
            data[i] = 255;
            data[i+1] = 255;
            data[i+2] = 255;
            for(var j= 0; j< colorImageDataStack.length;j++){
                data[i]=data[i] - (255-colorImageDataStack[j][i]);
                data[i+1]=data[i+1] - (255-colorImageDataStack[j][i+1]);
                data[i+2]=data[i+2] - (255-colorImageDataStack[j][i+2]);
            }
            if(data[i]<0){
                data[i] = 0;       
            }
            if(data[i+1]<0){
                data[i+1] = 0;       
            }
            if(data[i+2]<0){
                data[i+2] = 0;       
            }      
        }
        imageData.data = data;
        context.putImageData(imageData,0,0);
    }




    /**
     * 2色(白,黒)->(白,{r,g,b})
     * @param  {[type]} imageData [description]
     * @param  {[type]} colorData [description]
     * @return ImageData.data           [description]
     */
    module.selectColorFilter = function(imageData,colorData){
        var data = imageData.data;
        for(var i=0; i<data.length;i=i+4){
            if(data[i] == 0){
                data[i]=colorData.r;
                data[i+1] = colorData.g;
                data[i+2] = colorData.b;
            }
        }
        return data;
    }


    /**
     * 更新分を抽出
     * @param  {[type]} imageData [description]
     * @return ImageData.data           [description]
     */
    module.getDistance = function(imageData){
        var data = imageData.data;
        for(var i=0; i<module.imageDataStack.length;i++){
            var iImageData = module.imageDataStack[i];
            var iData = iImageData.data;
            for(var j=0; j<data.length;j=j+4){
                if(data[j] == 0){
                    if(iData[j] == 0){
                        data[j]=255;
                        data[j+1]=255;
                        data[j+2]=255;
                    }
                }
            }

        }


        
        return data;
    }

    /**
     * 3つまでImageDataを保管する 
     * @param  {[type]} context [description]
     * @return {[type]}         [description]
     */
    module.pushInstantImageStack = function(context){
        module.instantImageDataStack.push(context.getImageData(0,0,canvas.width,canvas.height));
        if(module.instantImageDataStack.length >3){
            module.instantImageDataStack.shift();
        }
    }

    module.binarizeFilter = function(imageData){
        for(var i=0;i<imageData.length;i=i+4){
            var B =  0.298912 * imageData[i] + 0.586611 * imageData[i+1] + 0.114478 * imageData[i+2];
            if(B>module.threshold){
                B = 255;
            }else{
                B = 0;
            }
            imageData[i] = B;
            imageData[i+1]=B;
            imageData[i+2]=B;
            imageData[i+3]=255;

        }
        //imageData.data = data;
        return imageData;
       // canvas.getContext('2d').putImageData(imageData,0,0);
    }

    /**
     * 二色化フィルター,直近3つのイメージデータを保持
     * @param  {[type]} context [description]
     * @return {[type]}         [description]
     */
    module.effectBinarize = function(context){
         var imageData = context.getImageData(0, 0, canvas.width, canvas.height),
            data = imageData.data;
            //TODO 3フレームの平均をとる->module.getAverageColor(imageData);
            imageData.data = module.binarizeFilter(data);
        context.putImageData(imageData, 0, 0);
        //モジュールで保管
        module.instantImageDataStack.push(imageData);

    }





    // module.getAverageColor= function(imageDatas){
    //     var nImageData=[];

    //     var imageData1 = imageDatas[0];
    //     var imageData2 = imageDatas[1];
    //     var imageData3 = imageDatas[2];
    //     for(var i=0; i<imageData1; i=i+4){
    //         nImageData[i] = (imageData1[i]+imageData2[i]+imageData3[i])/3;
    //         nImageData[i+1] = (imageData1[i+1]+imageData2[i+1]+imageData3[i+1])/3;
    //         nImageData[i+2] = (imageData1[i+2]+imageData2[i+2]+imageData3[i+2])/3;
    //         nImageData[i+3] = (imageData1[i+3]+imageData2[i+3]+imageData3[i+3])/3;
    //     }
    //     return nImageData;
    // }


    module.getIBoard = function(){
        module.imageDataStack.push(module.getDistance());
        colorDataStack.push(module.getColor(module.colorKey));
        var nImageDataStack =[];
        for(var i=0; i<module.imageDataStack.length;i++){
            nImageDataStack[i] = module.changeColor(imageDataStack[i],colorDataStack[i]);
        }

        for(var j=0; j<nImageDataStack[0].length;j=j+4){
            
            for(var i=0; i< nImageDataStack.length;i++){
                module.iBoardImageData[j] = iBoardImageData[j]+(255-nImageDataStack[i][j]);
                module.iBoardImageData[j+1] = iBoardImageData[j+1]-(255-nImageDataStack[i][j+1]);
                module.iBoardImageData[j+2] = iBoardImageData[j+2]-(255-nImageDataStack[i][j+2]);
                
            }
                if(moduleiBoardImageData[j] < 0){
                    module.iBoardImageData = 0;
                }
                if(iBoardImageData[j+1] < 0){
                    module.iBoardImageData = 0;
                }
                if(iBoardImageData[j+2] < 0){
                    module.iBoardImageData = 0;
                }
                module.iBoardImageData[j+3] = 255;
        }


        
    }

    module.changeColor = function(imageData,color){
        for(var i=0; i<imageData.length;i=i+4){
            if(imageData[i] == 0){
                imageData[i] = color.r;
                imageData[i+1] = color.g;
                imageData[i+2] = color.b;
            }
        }
        return imageData;
    }


    return module;
})();