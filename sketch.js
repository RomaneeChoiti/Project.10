let shapes = [];
const gravity = 0.3;
const friction = 0.99;
const shapeSize = 10; // 크기 감소
let spawnRate = 0.5; // 생성 속도 조정
const maxShapes = 3000; // 최대 도형 개수 제한

function setup() {
  createCanvas(1920, 380);
  noCursor(); // 마우스 커서 숨기기
  
  // 초기에 화면 전체를 선으로 채우기
  const gridSpacing = shapeSize * 2.5; // 선 간격
  for (let y = height - shapeSize; y >= 0; y -= gridSpacing) {
    for (let x = shapeSize; x < width; x += gridSpacing) {
      let newShape = new Polygon(x, y, shapeSize);
      newShape.isResting = false; // 움직이는 상태로 시작
      shapes.push(newShape);
    }
  }
}

function draw() {
  background(0, 0, 0);
  
  // 도형들 업데이트 및 표시
  for (let i = shapes.length - 1; i >= 0; i--) {
    let shape = shapes[i];
    
    // 물리 연산 적용
    shape.applyForce();
    shape.checkBoundaries(); // 경계 체크
    shape.update();
    
    // 근처 도형들과의 엉킴만 체크 (거리 기반 최적화)
    const checkRadius = shape.size * 4; // 검사 범위
    for (let j = 0; j < shapes.length; j++) {
      if (i !== j && shapes[j]) {
        let distance = dist(shape.pos.x, shape.pos.y, shapes[j].pos.x, shapes[j].pos.y);
        if (distance < checkRadius) {
          shape.preventOverlap(shapes[j]);
        }
      }
    }
    
    // 도형 표시
    shape.display();
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
    this.lineLength = random(1.2, 2.5); // 선의 길이를 무작위로
    
    // 노을에 비친 벼의 색상 (따뜻한 금색, 주황색, 붉은색)
    let colorType = random();
    if (colorType < 0.4) {
      // 금색
      this.r = random(200, 230);
      this.g = random(160, 200);
      this.b = random(80, 120);
    } else if (colorType < 0.7) {
      // 주황색
      this.r = random(220, 245);
      this.g = random(140, 180);
      this.b = random(60, 100);
    } else {
      // 붉은색
      this.r = random(210, 240);
      this.g = random(100, 140);
      this.b = random(80, 120);
    }
  }
  
  applyForce() {
    // 파동 모션 - sine 파동으로 좌우 흔들림 (강화)
    let waveForce = sin(this.life * 0.02) * 0.8;
    this.acc.x += waveForce;
    
    // 중력을 거의 없애고 대신 중심으로의 약한 복원력 (전체 화면에 고르게 분포)
    let centerY = height / 2;
    let distanceFromCenter = this.pos.y - centerY;
    this.acc.y += distanceFromCenter * 0.00005; // 매우 약한 중심 복원력
    
    // 마찰력
    this.vel.mult(friction);
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
    // 도형 위치 업데이트
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    
    // 가속도 초기화
    this.acc.mult(0);
    
    // 회전 업데이트
    this.rotation += this.rotationSpeed;
    
    // 생존 시간은 항상 증가
    this.life++;
  }
  
  checkBoundaries() {
    // 위쪽 경계
    if (this.pos.y - this.size < 0) {
      this.pos.y = this.size;
      this.vel.y = 0;
    }
    
    // 바닥 경계
    if (this.pos.y + this.size > height) {
      this.pos.y = height - this.size;
      this.vel.y = 0;
    }
    
    // 좌측 경계
    if (this.pos.x - this.size < 0) {
      this.pos.x = this.size;
      this.vel.x *= -1; // 반대 방향
    }
    
    // 우측 경계
    if (this.pos.x + this.size > width) {
      this.pos.x = width - this.size;
      this.vel.x *= -1; // 반대 방향
    }
  }
  
  preventOverlap(other) {
    // 두 도형이 겹쳐있는지 확인
    let distance = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
    let minDistance = (this.size + other.size) * 0.85; // 더 촘촘하게 조정
    
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
    
    stroke(this.r, this.g, this.b);
    strokeWeight(0.2);
    noFill();
    
    // 구불한 선 그리기 (Sine 곡선)
    beginShape();
    for (let x = -this.size * this.lineLength; x < this.size * this.lineLength; x += 2) {
      let y = sin((x + this.life * this.frequency) * 0.05) * this.amplitude;
      vertex(x, y);
    }
    endShape();
    
    pop();
  }
}
