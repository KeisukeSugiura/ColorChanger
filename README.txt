google closele
lightning design

YCbCr色空間
Y:輝度 0-255
Cb:青系統の色の色相と彩度 -128-128
Cr:赤系統の色の色相と彩度 -128-128

色相ブレンド法のベースアルゴリズム
Cb' = Cbcosθ + Crsinθ
Cr' = -Cbsinθ + Crcosθ
Cb" = Cb' - aCr'
Cr" = Cr'
Cb"' = (1 + asinθcosθ)Cb - (acosθcosθ)Cr
Cr"' = (asinθsinθ)Cb + (1 - asinθcosθ)Cr

θ:-10~-30
a:2or3（経験的に）

赤の領域判定
a'={a(Cr'>0), 0(Cr'<=0)}
緑の領域判定
a'={a(Cr'<=0), 0(Cr'>0)}


the 90-degree-hue-rotation method (HR)
色相回転法


色相ブレンド法アドバンスドアルゴリズム
Cb’ = Cbcosθ + Crsinθ -----(1)
Cr’ = – Cbsinθ + Crcosθ ----(2)
Cb” = Cb’ –a(Cr’ + b) -------(3)
Cr” = Cr’ -----------------------(4)
Cb’’’=(1+a sinθcosθ)Cb –(a cos2θ)Cr –ab cosθ --(5)
Cr’’’= (a sin2θ)Cb +(1–a sinθcosθ)Cr – ab sinθ --(6)

携帯型2 色覚・3 色覚双方向リアルタイム色覚シミュレータ
WO/2011/030814


赤判定->ブレンド法
緑判定->ブレンド法