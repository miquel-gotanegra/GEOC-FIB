/**
 TODO Replace this by your own, correct, triangulation function
 Triangles should be return as arrays of array of indexes
 e.g., [[1,2,3],[2,3,4]] encodes two triangles, where the indices are relative to the array points
**/

var vertices = {};
	//vertices[vertex_id] = {"x":pos_x,"y":pos_y,"edges":[incident, edges, to, v_i]};
var triangles = {};
	//triangles[triangle_id] = {"edges":[clocwise_oredred, edges, of, triangle_i],"original":true/false}
var DCEL = {};
	//DCEL[edge_id]= {"vB":intial_vertex, "vE":final_vertex, "fL":leftTriangle, "fR":rightTriangle,"eN": nextEdge ,"ePrima":oposite_directionEdge}
	//one for each direction
var aux_face = "T";

function findTriangle(point,aux_point,aux_face,lastTriangle){
	var segment = {"from":aux_point,"to":point};
	var e = triangles[aux_face].edges.map(m => DCEL[m]);
	//console.log(e);
	for(i=0;i<e.length;++i){
		var segment2 = {"from":vertices[e[i].vB],"to":vertices[e[i].vE]};
		if((e[i].fL != lastTriangle) && (e[i].fL != "ext") && intersection(segment,segment2)) {
			return findTriangle(point,aux_point,e[i].fL,aux_face);
		}
	}
	return aux_face;
}
//unused

function flip(edge){
	var prima = DCEL[edge].ePrima;
	var inserted_point = DCEL[DCEL[edge].eN].vE;
	var other_point =  DCEL[DCEL[prima].eN].vE;
	
	var T_izquierda = {'edges':[DCEL[DCEL[prima].eN].eN,DCEL[edge].eN,edge]};
	var T_derecha = {'edges':[DCEL[DCEL[edge].eN].eN,DCEL[prima].eN,prima]};
	//console.log(T_izquierda,T_derecha);
	triangles[DCEL[edge].fL] = T_derecha;
	triangles[DCEL[edge].fR] = T_izquierda;


	var edge_copy ={};
	Object.assign(edge_copy,DCEL[edge]);
	var prima_copy ={};
	Object.assign(prima_copy,DCEL[prima]);
	//change the flipped edge
	DCEL[edge] = {"vB":inserted_point, "vE":other_point, "fL":DCEL[edge].fL, "fR":DCEL[edge].fR,"eN":DCEL[DCEL[prima].eN].eN, "ePrima":prima};
	DCEL[prima] = {"vB":other_point, "vE":inserted_point, "fL":DCEL[prima].fL, "fR":DCEL[prima].fR, "eN":DCEL[edge_copy.eN].eN, "ePrima":edge};

	//updating edges info
	//primer triangulo
	next = DCEL[edge].eN
	DCEL[next].eN = edge_copy.eN;
	DCEL[next].fR = DCEL[edge].fR;
	DCEL[DCEL[next].ePrima].fL = DCEL[edge].fR;

	next = DCEL[next].eN;
	DCEL[next].eN = edge;

	//seguno triangulo
	next = DCEL[prima].eN
	DCEL[next].eN = prima_copy.eN;
	DCEL[next].fR = DCEL[prima].fR;
	DCEL[DCEL[next].ePrima].fL = DCEL[prima].fR;

	next = DCEL[next].eN;
	DCEL[next].eN = prima;

	//updating vertices info
	vertices[inserted_point].edges.push(prima);
	vertices[other_point].edges.push(edge);

	vertices[edge_copy.vB].edges.splice(vertices[edge_copy.vB].edges.indexOf(prima),1);
	vertices[prima_copy.vB].edges.splice(vertices[prima_copy.vB].edges.indexOf(edge),1);

	return(prima);
	
	
}
function computeTriangulation(points) {
	// console.log("points");console.log(points);
	vertices = {};
	triangles = {};
	DCEL = {};

	//random auxiliary point
	const aux_point = points[points.length-4];
	//console.log("Aux point: ");console.log(aux_point);
	aux_face = "T";
	var outputTriangles = new Array;
	
	
	//we initialize for the triangle encapsulating the points
	for (i=0;i<3;i++){
		vertices[points.length+i-3] = {"x":points[points.length+i-3].x,"y":points[points.length+i-3].y,"edges":[]};
	}
	var cap0 = points.length-3;
	var cap1 = points.length-2;
	var cap2 = points.length-1;
	//vertices["inf"] = {"x":null,"y":null,"edges":[]};
	DCEL[0] = {"vB":cap0, "vE":cap1, "fL":"ext", "fR":"T", "eN":2, "ePrima":1};
	DCEL[1] = {"vB":cap1, "vE":cap0, "fL":"T", "fR":"ext", "eN":"None", "ePrima":0};

	DCEL[2] = {"vB":cap1, "vE":cap2, "fL":"ext", "fR":"T", "eN":4, "ePrima":3};
	DCEL[3] = {"vB":cap2, "vE":cap1, "fL":"T", "fR":"ext", "eN":"None", "ePrima":2};
	
	DCEL[4] = {"vB":cap2, "vE":cap0, "fL":"ext", "fR":"T", "eN":0, "ePrima":5};
	DCEL[5] = {"vB":cap0, "vE":cap2, "fL":"T", "fR":"ext", "eN":"None", "ePrima":4};
	
	//we dont need the edges to "infinity" since we our hypothesis is that all the points are inside the triangle
	
   
	vertices[cap0].edges.push(1,4);
	vertices[cap1].edges.push(0,3);
	vertices[cap2].edges.push(2,5);

	
	triangles["ext"] = {"edges":[1,3,5],"original":false};
	triangles["T"] = {"edges":[0,2,4],"original":true};
	
	for (i=0;i<points.length-3;i++){
		console.log(`------iteration ${i}------`);
		var move_aux = false;
		v = points[i];
		vertices[i]={"x":v.x,"y":v.y,"edges":[]};
		var insideOf;
		if(i==0){
			insideOf = "T";
		}
		else{
			var startTime = performance.now();
			insideOf = findTriangle(v,aux_point, aux_face,"None");

			console.log("point ",v," inside of triangle "+insideOf);
			var endTime = performance.now();
			//console.log(`${i}: findTriangle took ${endTime - startTime} milliseconds`);
		}
		var OGtri = triangles[insideOf];
		var size = Object.keys(DCEL).length;

		if(insideOf == aux_face) move_aux=true; // if the auxiliary point was on the original triangle
		var aux_triangles = new Set();

		//for each edge of the orignial, we are gonna create a new triangle with said edge and the point given
		var startTime = performance.now();
		for(e = 0; e<OGtri.edges.length; ++e){
			var edg = DCEL[OGtri.edges[e]];
			DCEL[size+e*2]={"vB":edg.vE, "vE":i, "fL":(insideOf + ((e+1)%3)), "fR":(insideOf + e),"eN": size+2*e+1, "ePrima":size+(e*2+3)%6};
			DCEL[size+e*2+1]={"vB":i, "vE":edg.vB, "fL":(insideOf + ((e+2)%3)), "fR":(insideOf + e),"eN":OGtri.edges[e], "ePrima":size+(e*2+3+1)%6};

			DCEL[OGtri.edges[e]].eN = size+e*2;
			
			//console.log([OGtri.edges[e],size+e*2,size+e*2+1]);
			triangles[insideOf+e] = {"edges":[OGtri.edges[e],size+e*2,size+e*2+1]}
			if(move_aux) aux_triangles.add(insideOf+e);
			//update edge info BOTH SIDES
			DCEL[OGtri.edges[e]].fR = (insideOf + e);
			DCEL[DCEL[OGtri.edges[e]].ePrima].fL = (insideOf + e);

			//update vertex info
			vertices[i].edges.push(size+e*2);
			vertices[edg.vB].edges.push(size+e*2+1);
		}
		var endTime = performance.now();
		//console.log(`${i}: create edges took ${endTime - startTime} milliseconds`);
		
		
		console.log(aux_triangles)
		//delaunay
		if(i>0){
			var del_edges = [...vertices[i].edges];
			var flips = new Set;
			console.log("-----delaunay-----")
			while(del_edges.length>0){
				var edg_in = del_edges.shift();
				var tri = DCEL[DCEL[DCEL[edg_in].ePrima].eN].fL;
				console.log(`evaluatiing triangle ${tri}, found by incident edge ${edg_in}`);

				if(tri != "ext"){
					var vert_incident_triangle = triangles[tri].edges.map(m => DCEL[m].vB).map(x => vertices[x]);
					if (circleOrientationTest(points[i],vert_incident_triangle)<0) {
						
						//if we already flipped this edge it means 4 points are co-circular
						//so we skip to aviod infinite loops
						if(insideOf == tri){move_aux=true;} //if we break the triangle aux is in, we will check all the triangles affected by flips
						aux_triangles.add(tri);
						aux_triangles.add(DCEL[DCEL[DCEL[edg_in].ePrima].eN].fR)
						

						del_edges.push(edg_in);
						console.log("swap");
						console.log(`edge to flip -> ${DCEL[DCEL[edg_in].ePrima].eN}`);
						del_edges.push(flip(DCEL[DCEL[edg_in].ePrima].eN));
						flips.add(DCEL[DCEL[edg_in].ePrima].eN);
					}
				}
				
			}
		}
		
		
		
		//if we broke down the triangle where the auxiliar point was, we have to update aux_face 
	
		var startTime = performance.now();
		if(move_aux){
			for (const tri of aux_triangles) {
				console.log("Checking "+tri)
				t = triangles[tri].edges;
				if(trianglePoint(aux_point,t)){
					console.log("match!")
					aux_face = tri;
					console.log(aux_face)
					break;
				}; 
			  }
		}
		var endTime = performance.now();
		//console.log(`${i}: recalculate point took ${endTime - startTime} milliseconds`);
	
	
	
		//we store triangles that should be removed before return, since we need them all to find the triangle with a tree

		delete triangles[insideOf];
			
		
	}
	console.log("------------END STATE------------");
	console.log("vertices");console.log(vertices);
	console.log("triangles");console.log(triangles);
	console.log("DCEL");console.log(DCEL);
	var i = 0;
	for (let x in triangles) {
		outputTriangles.push(triangles[x].edges.map(m => DCEL[m].vE));
		++i;
		
	}

	
	
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
	//if it has the same determinant on each segement, it means its inside
	return (d1 === d2 && d1 === d3) //three of a kind, cant be 0 because a point cant be on the three edges of a triangle at the same time
		
}
function determinant3x3(M){
	return (M[0][0] * M[1][1] * M[2][2]) + (M[0][1] * M[1][2] * M[2][0]) + (M[0][2] * M[1][0]* M[2][1]) + 
	(-1 * ((M[2][0] * M[1][1] * M[0][2]) + (M[2][1] * M[1][2] * M[0][0]) + (M[2][2] * M[1][0]* M[0][1])));
  }
function circleOrientationTest(p,circle_points){
	var a = circle_points[0];
	var b = circle_points[1];
	var c = circle_points[2];

	var det = determinant3x3([  [b.x-a.x , b.y-a.y, (b.x-a.x)*(b.x+a.x) + (b.y-a.y)*(b.y+a.y)],
								[c.x-a.x , c.y-a.y, (c.x-a.x)*(c.x+a.x) + (c.y-a.y)*(c.y+a.y)],
								[p.x-a.x , p.y-a.y, (p.x-a.x)*(p.x+a.x) + (p.y-a.y)*(p.y+a.y)]]);

	var A = [a.x, a.y, a.x^2+a.y^2]
	var B = [b.x, b.y, b.x^2+b.y^2]    
	var C = [c.x, c.y, c.x^2+c.y^2]

	var AB = math.subtract(B,A);
	var AC = math.subtract(C,A);

	// we compute the normal of the plane, if the z is negative we know the plane is facing down
	//if its facing down we flip the determinant
	var normal = math.cross(AB,AC);
	if(normal[2]<0) det = det *-1;

	if (det == 0) return 0;
	else if (det > 0) return 1;
	else return -1;
}
