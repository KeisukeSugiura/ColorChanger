
/*
	----------------
	アイデア1(鏡面反射除去についての論文より)
	----------------
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

	-------------------
	アイデア2(輝度平均と最大分散での調整)
	-------------------
	M色空間を用いる
	上記の論文によれば,Izを調整すればできるはず
	->Izの平均aveIzを求める,最大値maxIzも求める
	->aveIzを閾値として,(maxIz-aveIz)を引く
	

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

    module.effectSmoothReflection = function(canvas){
    	var context = canvas.getContext('2d');
         var imageData = context.getImageData(0, 0, canvas.width, canvas.height),
            data = imageData.data;
            //TODO 3フレームの平均をとる->module.getAverageColor(imageData);
            imageData.data = module.reflectionSmoothFilter(data);
        context.putImageData(imageData, 0, 0);
        
    }
    module.smoothReflection = function(Iz,MaxIz,MinIz,AveIz){

    	if(Iz > AveIz){
    		Iz = Iz - (Iz/MaxIz)*(Iz- AveIz);
      	}
    	return Iz;
    }
    
    module.reflectionSmoothFilter = function(imageData){
    	//引数imageData.data
    	var hsiData = [];
    	var maxIz = 0;
    	var minIz =300;
    	var sumIz = 0;
    	var sumIx = 0;
    	var sumIy = 0;
    	var countIz =0;
    	//色相情報調べる
    	for(var i = 0; i< imageData.length;i=i+4){
    		var hsi = module.rgb2advhsi([imageData[i],imageData[i+1],imageData[i+2]]);
    		hsiData[i]=hsi[0];
    		hsiData[i+1]=hsi[1];
    		hsiData[i+2]=hsi[2];
    		hsiData[i+3]=imageData[i+3];
    		//console.log(hsi[2]);
    		countIz++;
    		sumIz=sumIz+hsi[2];
    		if(maxIz < hsi[2]){
    			maxIz = hsi[2];
    		}
    		if(minIz > hsi[2]){
    			minIz = hsi[2];
    		}
    	}	
    	var aveIz = sumIz/countIz;
    	var aveIx = sumIx/countIz;
    	var aveIy = sumIy/countIz;

    	console.log(maxIz);
    	console.log(countIz);
    	console.log(imageData.length);
    	console.log(aveIz);

    	//画像処理する
    	for(var i=0;i<hsiData.length;i=i+4){
    		hsiData[i+2] = module.smoothReflection(hsiData[i+2],maxIz,minIz,aveIz);
    	}



    	for(var i=0;i<hsiData.length;i=i+4){
    		var rgb = module.advhsi2rgb([hsiData[i],hsiData[i+1],hsiData[i+2]]);
    		imageData[i] = rgb[0];
    		imageData[i+1] = rgb[1];
    		imageData[i+2] = rgb[2];
    	}


    	return imageData;
    }


	return module;
})();