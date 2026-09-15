"""Independent numerical reference for the Metabolism Lab (not clinical validation).

Recomputes scripts/fixtures/metabolism-reference.json with SciPy DOP853.
Uses kJ (the browser uses kcal) and solves equations 3/5 as a simultaneous
linear system (the browser uses the closed form in equation 9).
Source: Hall et al. Lancet 2011, supplementary appendix equations 1–9.
Run: python3 scripts/metabolism-reference.py (requires numpy and scipy).
"""
import json
from datetime import date, timedelta
from pathlib import Path
import numpy as np
from scipy.integrate import solve_ivp

PROFILE = dict(weight=90, height=175, age=40, sex="male", bodyFat=30,
               pal=1.5, maintenance=2700, baselineCarbs=300, baselineSodium=3000)
PLAN = dict(protein=150, carbs=220, fat=80, sodium=3000, activity=0,
            weekendExtra=0, changeDay=0, laterExtra=0)
cases = [
    dict(name="deficit", profile=PROFILE, plan=PLAN, days=180),
    dict(name="surplus", profile=PROFILE, plan={**PLAN, "carbs": 375, "fat": 100}, days=180),
    dict(name="scheduled_change", profile={**PROFILE, "sex": "female", "maintenance": 2300},
         plan={**PLAN, "sodium": 2200, "activity": 150, "weekendExtra": 700,
               "changeDay": 56, "laterExtra": 200}, days=180),
]

for case in cases:
    p, plan = case["profile"], case["plan"]
    case["startDate"] = "2026-09-21"
    m = p["maintenance"] * 4.184
    rmr = (10*p["weight"] + 6.25*p["height"] - 5*p["age"] + (5 if p["sex"] == "male" else -161)) * 4.184
    delta = (0.9*p["pal"]-1) * rmr / p["weight"]
    initial = np.array([p["weight"]*p["bodyFat"]/100,
                        p["weight"]*(1-p["bodyFat"]/100)-1.85, 0.5, 0, 0, 0])
    k = m - 13*initial[0] - 92*initial[1] - delta*p["weight"]
    ci0 = p["baselineCarbs"]*4*4.184
    state = initial.copy()
    snapshots = []
    for day in range(1, case["days"]+1):
        weekend = (date.fromisoformat(case["startDate"])+timedelta(days=day-1)).weekday() >= 5
        base_intake = 4*plan["protein"]+4*plan["carbs"]+9*plan["fat"]
        ei_kcal = base_intake + (plan["weekendExtra"] if weekend else 0) + (plan["laterExtra"] if plan["changeDay"] and day >= plan["changeDay"] else 0)
        ci = 4*4.184*plan["carbs"]*ei_kcal/base_intake
        ei = ei_kcal*4.184
        def derivatives(_t, y):
            f, lean, g, fluid, at, _energy = y
            dg = (ci-ci0/0.25*g*g)/17600
            de = (plan["sodium"]-p["baselineSodium"]-3000*fluid-4000*(1-ci/ci0))/3220
            part = (10.4*7600/39500)/(10.4*7600/39500+f)
            weight = f+lean+3.7*g+fluid
            ee0 = k+13*f+92*lean+(delta+plan["activity"]*4.184/p["weight"])*weight+0.1*(ei-m)+at
            balance = ei-ee0-17600*dg
            df, dl = np.linalg.solve([[39500/(1-part)+750, 960],
                                     [750, 7600/part+960]], [balance, balance])
            ee = ee0+750*df+960*dl
            return [df, dl, dg, de, (0.14*(ei-m)-at)/14, ei-ee]
        result = solve_ivp(derivatives, [0, 1], state, method="DOP853", rtol=1e-11, atol=1e-12)
        assert result.success
        energy_before = state[5]
        state = result.y[:, -1]
        if day in [1, 7, 30, 90, 180]:
            f, lean, g, fluid, at, energy = state
            snapshots.append(dict(day=day, fat=f, lean=lean, glycogen=g, fluid=fluid,
                                  adaptation=at/4.184, energy=energy/4.184,
                                  weight=f+lean+3.7*g+fluid,
                                  expenditure=(ei-(energy-energy_before))/4.184))
    case["expected"] = snapshots

out = Path(__file__).parent / "fixtures" / "metabolism-reference.json"
out.parent.mkdir(exist_ok=True)
out.write_text(json.dumps({"method": "SciPy DOP853; kJ; simultaneous equations 3 and 5", "cases": cases}, indent=2)+"\n")
print(f"Wrote {out}")
