def generate_recommendations(probability: float, risk_level: str, input_data: dict) -> list:
    """Generate retention recommendations based on prediction and input features."""
    recommendations = []

    session_duration = input_data.get("session_duration_sec", 0)
    session_views = input_data.get("session_views", 0)
    hist_transactions = input_data.get("hist_transactions", 0)
    hist_conversion_rate = input_data.get("hist_conversion_rate", 0)
    session_addtocarts = input_data.get("session_addtocarts", 0)

    if risk_level == "High Risk":
        # High risk recommendations
        if session_duration < 60:
            recommendations.append({
                "action": "Send a cart reminder notification",
                "reason": f"Very short session ({session_duration:.0f}s) suggests the visitor may have been interrupted or distracted before completing checkout.",
                "priority": "high"
            })
        else:
            recommendations.append({
                "action": "Send a personalized cart reminder email",
                "reason": f"The visitor spent {session_duration:.0f}s browsing but did not complete the purchase, indicating possible hesitation.",
                "priority": "high"
            })

        if hist_transactions == 0:
            recommendations.append({
                "action": "Offer first-purchase incentive",
                "reason": "This visitor has no prior purchase history. A first-time buyer incentive could help convert.",
                "priority": "high"
            })

        if session_addtocarts > 2:
            recommendations.append({
                "action": "Simplify the checkout process",
                "reason": f"The visitor added {session_addtocarts} items to cart in this session, suggesting strong purchase intent but possible checkout friction.",
                "priority": "medium"
            })

    elif risk_level == "Medium Risk":
        recommendations.append({
            "action": "Send a gentle cart reminder",
            "reason": "Moderate abandonment risk detected. A timely reminder may re-engage this visitor.",
            "priority": "medium"
        })

        if hist_conversion_rate > 0:
            recommendations.append({
                "action": "Highlight previously purchased items or similar products",
                "reason": f"This visitor has a {hist_conversion_rate*100:.0f}% historical conversion rate, indicating past buying interest.",
                "priority": "medium"
            })

        if session_views > 5:
            recommendations.append({
                "action": "Show product comparison or reviews",
                "reason": f"The visitor viewed {session_views} items, suggesting they are actively comparing products.",
                "priority": "low"
            })

    else:  # Low Risk
        recommendations.append({
            "action": "No immediate action needed",
            "reason": "This visitor shows low abandonment risk based on their browsing and purchase patterns.",
            "priority": "low"
        })

        if hist_conversion_rate > 0.5:
            recommendations.append({
                "action": "Consider loyalty program enrollment",
                "reason": f"High historical conversion rate ({hist_conversion_rate*100:.0f}%) indicates a loyal customer.",
                "priority": "low"
            })

    return recommendations
