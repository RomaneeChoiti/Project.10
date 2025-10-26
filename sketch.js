let shapes = [];
const gravity = 0.3;
const friction = 0.99;
const shapeSize = 15;
let spawnRate = 0.15;

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // 초기 도형들 생성
  for (let i = 0; i < 3; i++) {
    shapes.push(new Polygon(
      random(width),
      random(height * 0.3),
      shapeSize
    ));
  }
}

function draw() {
  background(0, 0, 0);
  
  // 화면 상단이 채워졌는지 확인
  let isScreenFilled = false;
  let minHeight = height;
  for (let shape of shapes) {
    if (shape.isResting) {
      minHeight = min(minHeight, shape.pos.y - shapeSize);
    }
  }
  
  // 화면 상단(y < shapeSize)이 차면 생성 중단
  if (minHeight < shapeSize) {
    isScreenFilled = true;
    spawnRate = 0;
  }
  
  // 새로운 도형 추가
  if (random() < spawnRate) {
    shapes.push(new Polygon(
      random(shapeSize, width - shapeSize),
      -shapeSize,
      shapeSize
    ));
  }
  
  // 도형들 업데이트 및 표시
  for (let i = shapes.length - 1; i >= 0; i--) {
    let shape = shapes[i];
    
    // 물리 연산 적용
    shape.applyForce();
    shape.checkBoundaries();
    shape.update();
    
    // 다른 도형들과의 겹침 방지
    for (let j = 0; j < shapes.length; j++) {
      if (i !== j && shapes[j]) {
        shape.preventOverlap(shapes[j]);
        // 다른 도형 위에 올려졌는지 확인
        if (shapes[j].isResting && shape.isOnTopOf(shapes[j])) {
          shape.vel.y = 0;
          shape.vel.x = 0;
          shape.rotationSpeed = 0;
          shape.isResting = true;
        }
      }
    }
    
    // 도형 표시
    shape.display();
    
    // 화면 아래로 떨어지고 충분히 오래된 도형 제거
    if (shape.pos.y > height + shapeSize * 2 && shape.life > 60) {
      shapes.splice(i, 1);
    }
  }
}

class Polygon {
  constructor(x, y, size) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.size = size;
    this.mass = 1;
    this.life = 0;
    this.isResting = false;
    this.rotation = random(TWO_PI);
    this.rotationSpeed = random(-0.05, 0.05);
    this.amplitude = random(5, 15);
    this.frequency = random(0.05, 0.15);
  }
  
  applyForce() {
    // 쉬는 상태가 아닐 때만 중력 적용
    if (!this.isResting) {
      this.acc.y += gravity;
      this.vel.mult(friction);
    }
  }
  
  isOnTopOf(other) {
    // this가 other 위에 있는지 확인
    let verticalDistance = this.pos.y - other.pos.y;
    let horizontalDistance = abs(this.pos.x - other.pos.x);
    
    // 더 촘촘한 감지를 위해 거리 감소
    return (verticalDistance > 0 && 
            verticalDistance < (this.size + other.size) * 0.5 && 
            horizontalDistance < (this.size + other.size) * 0.6);
  }
  
  update() {
    // 쉬는 상태가 아닐 때만 업데이트
    if (!this.isResting) {
      // 도형 위치 업데이트
      this.vel.add(this.acc);
      this.pos.add(this.vel);
      
      // 가속도 초기화
      this.acc.mult(0);
      
      // 회전 업데이트 (낙하 중일 때만)
      this.rotation += this.rotationSpeed;
    }
    
    // 생존 시간은 항상 증가
    this.life++;
  }
  
  checkBoundaries() {
    // 바닥 충돌
    if (this.pos.y + this.size > height) {
      this.pos.y = height - this.size;
      
      // 바닥에 닿으면 멈춤
      this.vel.y = 0;
      this.vel.x = 0;
      this.rotationSpeed = 0; // 회전도 멈춤
      this.isResting = true;
    }
    
    // 좌우 벽 충돌
    if (this.pos.x - this.size < 0) {
      this.pos.x = this.size;
      if (abs(this.vel.x) < 2) {
        this.vel.x = 0;
      } else {
        this.vel.x *= -0.3;
      }
    }
    if (this.pos.x + this.size > width) {
      this.pos.x = width - this.size;
      if (abs(this.vel.x) < 2) {
        this.vel.x = 0;
      } else {
        this.vel.x *= -0.3;
      }
    }
  }
  
  preventOverlap(other) {
    // 두 도형이 겹쳐있는지 확인
    let distance = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
    let minDistance = (this.size + other.size) * 0.9; // 더 촘촘하게 쌓이도록 조정
    
    if (distance < minDistance && distance > 0) {
      // 겹침을 분리하는 방향 계산
      let angle = atan2(other.pos.y - this.pos.y, other.pos.x - this.pos.x);
      let overlap = minDistance - distance;
      
      // 움직이는 도형만 밀어냄 (정지한 도형은 움직이지 않음)
      if (!this.isResting && !other.isResting) {
        // 둘 다 움직이면 각각 반반씩 밀려남
        this.pos.x -= cos(angle) * overlap / 2;
        this.pos.y -= sin(angle) * overlap / 2;
        other.pos.x += cos(angle) * overlap / 2;
        other.pos.y += sin(angle) * overlap / 2;
      } else if (!this.isResting) {
        // this만 움직이면 this가 밀려남
        this.pos.x -= cos(angle) * overlap;
        this.pos.y -= sin(angle) * overlap;
      } else if (!other.isResting) {
        // other만 움직이면 other가 밀려남
        other.pos.x += cos(angle) * overlap;
        other.pos.y += sin(angle) * overlap;
      }
      // 둘 다 정지하면 아무것도 안 함
      
      // other가 정지하고 this가 위에 올라온 경우, this도 정지
      if (other.isResting && !this.isResting && angle < PI && angle > 0) {
        // this가 other 위에 있으면 정지
        if (this.pos.y + this.size >= other.pos.y - this.size) {
          this.vel.y = 0;
          this.vel.x = 0;
          this.rotationSpeed = 0;
          this.isResting = true;
        }
      }
    }
  }
  
  display() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.rotation);
    
    stroke(255);
    strokeWeight(0.2); // 얇은 두께
    noFill();
    
    // 구불한 선 그리기 (Sine 곡선)
    beginShape();
    for (let x = -this.size * 1.5; x < this.size * 1.5; x += 2) {
      let y = sin((x + this.life * this.frequency) * 0.05) * this.amplitude;
      vertex(x, y);
    }
    endShape();
    
    pop();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
