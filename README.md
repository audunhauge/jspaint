# jspaint
Simple canvas painter - object based - educational

This is the code for a step-by-step tutorial in creating a painting app.
Intended to show use of classes and jsdoc.

In the final stages we import functions for detecting overlap
bewtween polygons - convex hull wrapping (jarvis walk) and other
functions from the 2d realm. These algorithms are not explained in detail.

They are taken from wikipedia and implemented in js.
The intent is to show how to incorporate functions you do not really 
understand how work - but can still use.

The model we use to store Shapes and interact with them is also stress-tested a bit.
What happens if I make a large number of shapes and try to scale/rotate/move them all ?

We implement some simplifications in the methods for showing ghost shapes so that 
rotate/scale/move doesn't lag too much - even for large selections.
Basicly we create a convecs hull around all shapes and only show this outline
if the number of shapes passes a certain limit (n=1 for now).