/**
 TODO Replace this by your own, correct, triangulation function
 Triangles should be return as arrays of array of indexes
 e.g., [[1,2,3],[2,3,4]] encodes two triangles, where the indices are relative to the array points
**/

var vertices = {};
	//vertices[vertex_id] = {"x":pos_x,"y":pos_y,"edges":[incident, edges, to, v_i]};
var triangles = {};
	//triangles[triangle_id] = {"edges":[clocwise_oredred, edges, of, triangle_i],"original":true/false}
var removed_triangles= new Set();
var DCEL = {};
	//DCEL[edge_id]= {"vB":intial_vertex, "vE":final_vertex, "fL":leftTriangle, "fR":rightTriangle, "eP": ????previousEdge, "eN": nextEdge ,"ePrima":oposite_directionEdge}
	//one for each direction

function findTriangle(point,insideOf){
	if((insideOf+"0") in triangles){ //if this triangle has subtriangles
	for(e = 0; e<3;++e){
		var t = triangles[insideOf+e].edges;
		if(trianglePoint(point,t)){ //if this point is inide the sub triangle
			return findTriangle(point,insideOf+e)
		}
	}
	}
	else return insideOf;
}
function computeTriangulation(points) {
	// Wrong code! Just connects consecutive three after sorting by x-coord
	// Note that this does NOT return a triangulation, just a subset of it
	//var newPoints = points.sort(function(a,b) { if ((a.x) < (b.x)) return -1; else return 1;})
	
	// console.log("points");console.log(points);

	//random auxiliary point
	const aux_point = points[points.length-4];
	var aux_face = "T";
	var outputTriangles = new Array;
	
	
	//we initialize for the triangle encapsulating the points
	for (i=0;i<3;i++){
		vertices[points.length+i-3] = {"x":points[points.length+i-3].x,"y":points[points.length+i-3].y,"edges":[]};
	}
	var cap0 = points.length-3;
	var cap1 = points.length-2;
	var cap2 = points.length-1;
	//vertices["inf"] = {"x":null,"y":null,"edges":[]};
	DCEL[0] = {"vB":cap0, "vE":cap1, "fL":"ext", "fR":"T", "eP": 5, "eN":2, "ePrima":1};
	DCEL[1] = {"vB":cap1, "vE":cap0, "fL":"T", "fR":"ext", "eP": 2, "eN":5, "ePrima":0};

	DCEL[2] = {"vB":cap1, "vE":cap2, "fL":"ext", "fR":"T", "eP": 1, "eN":4, "ePrima":3};
	DCEL[3] = {"vB":cap2, "vE":cap1, "fL":"T", "fR":"ext", "eP": 4, "eN":1, "ePrima":2};
	
	DCEL[4] = {"vB":cap2, "vE":cap0, "fL":"ext", "fR":"T", "eP": 3, "eN":0, "ePrima":5};
	DCEL[5] = {"vB":cap0, "vE":cap2, "fL":"T", "fR":"ext", "eP": 0, "eN":3, "ePrima":4};
	
	//we dont need the edges to "infinity" since we our hypothesis is that all the points are inside the triangle
	
   
	vertices[cap0].edges.push(1,4);
	vertices[cap1].edges.push(0,3);
	vertices[cap2].edges.push(2,5);

	
	triangles["ext"] = {"edges":[1,3,5],"original":false};
	triangles["T"] = {"edges":[0,2,4],"original":true};
	




	for (i=0;i<points.length-3;i++){
		v = points[i];
		vertices[i]={"x":v.x,"y":v.y,"edges":[]};
		var insideOf;
		if(i==0){
			insideOf = "T";
		}
		else{
			insideOf = findTriangle(v,"T");
		}
		var OGtri = triangles[insideOf];
		var size = Object.keys(DCEL).length;

		//para llevar la cuenta de los triangulos modificados, sobre todo con Delaunay
		var triangle_list = new Array;

		//for each edge of the orignial, we are gonna create a new triangle with said edge and the point given
		for(e = 0; e<OGtri.edges.length; ++e){
			var edg = DCEL[OGtri.edges[e]];
			DCEL[size+e*2]={"vB":edg.vE, "vE":i, "fL":(insideOf + ((e+1)%3)), "fR":(insideOf + e), "eP": OGtri.edges[(e+1)%3], "eN": size+2*e+1, "ePrima":size+(e*2+3)%6};
			DCEL[size+e*2+1]={"vB":i, "vE":edg.vB, "fL":(insideOf + ((e+2)%3)), "fR":(insideOf + e), "eP": size+(((e+2)+1)%6), "eN":OGtri.edges[e], "ePrima":size+(e*2+3+1)%6};
			//console.log([OGtri.edges[e],size+e*2,size+e*2+1]);
			triangles[insideOf+e] = {"edges":[OGtri.edges[e],size+e*2,size+e*2+1]}

			//update edge info BOTH SIDES
			DCEL[OGtri.edges[e]].fR = (insideOf + e);
			DCEL[DCEL[OGtri.edges[e]].ePrima].fL = (insideOf + e);

			//update vertex info
			vertices[i].edges.push(size+e*2);
			vertices[edg.vB].edges.push(size+e*2+1);
		}
		//delaunay
		/*
		//this halves performance and doesnt find any swap
		if(i>0){
			
			for(v = 0;v < vertices[i].edges.length;++v){
				console.log("delaunay")
				var edg_in = vertices[i].edges[v];
				var edg_eN = DCEL[edg_in].eN;
				var edg_eNN = DCEL[edg_eN].eN;
				var point = DCEL[DCEL[edg_eNN].eP].vE;
				if (trianglePoint(vertices[point],[edg_in,edg_eN,edg_eNN])) console.log("swap");
			}
		}
		*/
		
		//we delete te original triangle from the list
		removed_triangles.add(insideOf);
	}
	// console.log("vertices");console.log(vertices);
	// console.log("triangles");console.log(triangles);
	// console.log("DCEL");console.log(DCEL);
	for (let x in triangles) {
		if(!removed_triangles.has(x))
			outputTriangles.push(triangles[x].edges.map(m => DCEL[m].vE));
		++i;
		
	}
	//console.log(outputTriangles);
	return outputTriangles;
}







// ------------------------------------------------------------------------
// -------------------TWEAKED CODE FROM PREVIOUS SESIONS-------------------
// ------------------------------------------------------------------------

function determinant2x2(p,q,r){
	//we only care about the sign, not the number
	var det = ((q.x - p.x) * (r.y-p.y)) - ((r.x-p.x) * (q.y-p.y));
	if (det == 0) return 0;
	else if (det > 0) return 1;
	else return -1;
}
function share_a_point(s1,s2){
	return (_.isEqual(s1.from,s2.from) | _.isEqual(s1.from,s2.to) | _.isEqual(s1.to,s2.from) | _.isEqual(s1.to,s2.to));
}
// TODO: Add your code here to classify all possible segment intersection types
function intersection(s1, s2) {
	var  s11= determinant2x2(s1.from,s1.to,s2.from);
	var  s12= determinant2x2(s1.from,s1.to,s2.to);
	var  s21= determinant2x2(s2.from,s2.to,s1.from);
	var  s22= determinant2x2(s2.from,s2.to,s1.to);
	var intersectionType, intersectionTypeDescription;
	if(share_a_point(s1,s2)){
//if they share a point they already intersect so either each extreme is on a diferent side or both determinants are 0
		if(s11 == s22){return true;//intersectionTypeDescription = "s1 intersects s2 (are co-linear and share one extreme)";
		}
		else{return true;//intersectionTypeDescription = "s1 intersects s2 (they share an extrem)";
		}
	}
	else if(s11==s21 && s11==0){
// they are co-linear, now lets check if they colide
		var intersect = false;
		if(s1.from.y == s2.from.y){
			intersect = (Math.min(s1.from.x,s1.to.x) < Math.max(s2.from.x,s2.to.x) & Math.min(s2.from.x,s2.to.x) < Math.max(s1.from.x,s1.to.x) )
		}
		else{
			intersect = (Math.min(s1.from.y,s1.to.y) < Math.max(s2.from.y,s2.to.y) & Math.min(s2.from.y,s2.to.y) < Math.max(s1.from.y,s1.to.y) )
		}
		if(intersect){return true;//intersectionTypeDescription = "s1 intersects s2 (are co-linear)";
		}
		else{return false;//intersectionTypeDescription = "s1 doesnt intesect s2";
		}
	}
	else if ( (s11 != s12) && (s21 != s22) )  {
//both lines have their extrems at diferents sides of of the oposed line
		if(s11*s12*s21*s22 == 0){return true;//IntersectionTypeDescription = "s1 intersects s2 (one extreme belongs to the other segment but not co-lineal)";
		}
		else{return true;//intersectionTypeDescription = "s1 intersects s2 (they share one point)";
		}
	}
	else {return false;//intersectionTypeDescription = "s1 doesnt intesect s2";
		}
		
	// Return object with two fields: a numbered type, and a description
	return {"type": intersectionType, "description": intersectionTypeDescription} ;
}

function trianglePoint(p, t) {
	var d1 = determinant2x2(vertices[DCEL[t[0]].vB],vertices[DCEL[t[0]].vE],p);
  	var d2 = determinant2x2(vertices[DCEL[t[1]].vB],vertices[DCEL[t[1]].vE],p);
	var d3 = determinant2x2(vertices[DCEL[t[2]].vB],vertices[DCEL[t[2]].vE],p);

	var a1 = Math.abs(d1);
	var a2 = Math.abs(d2);
	var a3 = Math.abs(d3);

	//if it has the same determinant on each segement, it means its inside
	return (d1 === d2 && d1 === d3) //three of a kind, cant be 0 because a point cant be on the three edges of a triangle at the same time
		
}















