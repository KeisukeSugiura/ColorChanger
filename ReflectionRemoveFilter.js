
/*
	二色性反射モデル
	I:反射光の輝度
	Is:鏡面反射成分の輝度
	Id:拡散反射成分の輝度
	(1)I = Is + Id

	hsi色空間
	hue:色相
	saturation:彩度:鮮やかさ
	intensity:明度,輝度,明るさ
	
	D.Miyazaki提案の色空間(勝手にadvHSIとよぶ)
	hue:(Ix,Iy)平面上においてIz軸となす角度
	saturation:(Ix,Iy)平面上で,原点に近いほど小さい
	internsity:Iz軸

	仮定
	・光源が白色で一様
	・物体の鏡面反射成分は光源のスペクトルと同じ(NIR仮定)
	・一つのhueには一つのsurface colorしかないこと


 */

rrf = (function(){
	var module = {};
	 module.threshold = 120;//白黒の閾値

	/**
	 * [M色空間に変換]
	 * @param  {[type]} rgbArr [description]
	 * @return {[type]}        [description]
	 */
	module.rgb2advhsi = function(rgbArr){
		
		var r = rgbArr[0];
		var g = rgbArr[1];
		var b = rgbArr[2];

		var Ix = r - g/2 -b/2;
		var Iy = Math.sqrt(3)*g/2 - Math.sqrt(3)*b/2;
		var Iz = r/3 + g/3 + b/3;

		return [Ix,Iy,Iz];
	}

	/**
	 * [通常のHSI色空間に変換]
	 * @param  {[type]} advhsiArr [description]
	 * @return {[type]}           [description]
	 */
	module.advhsi2hsi = function(advhsiArr){
		var Ix = advhsiArr[0];
		var Iy = advhsiArr[1];
		var Iz = advhsiArr[2];

		var hue = Math.atan(Iy/Ix) / (Math.PI/180);//Math.PI/180で除算:ラジアン->角度
		var saturation = Math.sqrt(Ix*Ix + Iy*Iy);
		var intensity = Iz;

		return [hue,saturation,intensity];
	}

	/**
	 * [M色空間上でSpecular-free画像の生成]
	 * @param  {[type]} advhsiArr [description]
	 * @return {[type]}           [description]
	 */
	module.makeSFPWithadvhsi = function(advhsiArr){
		
		var a = 1;

		var Ix = advhsiArr[0];
		var Iy = advhsiArr[1];
		var Iz = advhsiArr[2];

		var nIz = a* Math.sqrt(Ix*Ix + Iy*Iy);

		return [Ix,Iy,nIz];
		
	}

	/**
	 * [M色空間->RGB色空間]
	 * @param  {[type]} advhsiArr [description]
	 * @return {[type]}           [description]
	 */
	module.advhsi2rgb = function(advhsiArr){
		
		var Ix = advhsiArr[0];
		var Iy = advhsiArr[1];
		var Iz = advhsiArr[2];

		var r = 2*Ix/3+Iz;
		var g = 0-Ix/3 + Iy/Math.sqrt(3) + Iz;
		var b = 0-Ix/3 - Iy/Math.sqrt(3) + Iz;

		return [r,g,b];
	}

	module.removeReflection = function(rgbArr){
		return module.advhsi2rgb(module.makeSFPWithadvhsi(module.rgb2advhsi(rgbArr)));
	}

	module.effectRemoveReflection = function(canvas){
		var ctx = canvas.getContext('2d');
		 var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height),
            data = imageData.data;

        // 書き換えたdataをimageDataにもどし、描画する
        imageData.data = module.reflectionFilter(data);
        ctx.putImageData(imageData, 0, 0);
	}

	/**
	 * [reflectionFilter description]
	 * @param  {[type]} imageData.data [description]
	 * @return {[type]} imageData.data          [description]
	 */
	module.reflectionFilter = function(imageData){
		for(var i=0;i<imageData.length;i=i+4){
         	var nRGB = module.removeReflection([imageData[i],imageData[i+1],imageData[i+2]]);
         	imageData[i] = nRGB[0];
         	imageData[i+1] = nRGB[1];
         	imageData[i+2] = nRGB[2];
         }
         return imageData;
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
    module.effectBinarize = function(canvas){
    	var context = canvas.getContext('2d');
         var imageData = context.getImageData(0, 0, canvas.width, canvas.height),
            data = imageData.data;
            //TODO 3フレームの平均をとる->module.getAverageColor(imageData);
            imageData.data = module.binarizeFilter(data);
        context.putImageData(imageData, 0, 0);
        //モジュールで保管
        //module.instantImageDataStack.push(imageData);

    }


	return module;
})();